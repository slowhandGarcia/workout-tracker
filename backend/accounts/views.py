from datetime import timedelta

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils import timezone
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import LoginAttempt
from .serializers import (
    CustomTokenObtainPairSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    RegisterSerializer,
    UserSerializer,
)

User = get_user_model()

_MAX_ATTEMPTS = getattr(settings, "LOGIN_MAX_ATTEMPTS", 5)
_LOCKOUT_MINUTES = getattr(settings, "LOGIN_LOCKOUT_MINUTES", 15)


class RegisterView(generics.CreateAPIView):
    """POST /api/auth/register/ — create an account and log in immediately."""

    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user": UserSerializer(user).data,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(TokenObtainPairView):
    """POST /api/auth/login/ — body: { email, password }.

    Rate-limited: after LOGIN_MAX_ATTEMPTS failures within LOGIN_LOCKOUT_MINUTES
    the endpoint returns 429 until the window expires. Successful login clears
    the counter. Failures for non-existent emails are recorded too, so an
    attacker can't bypass the lock by varying a known-bad email."""

    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        email = request.data.get("email", "").strip().lower()

        if email:
            cutoff = timezone.now() - timedelta(minutes=_LOCKOUT_MINUTES)
            recent_failures = LoginAttempt.objects.filter(
                email=email, attempted_at__gte=cutoff
            ).count()
            if recent_failures >= _MAX_ATTEMPTS:
                return Response(
                    {"detail": "Too many failed attempts. Please try again later."},
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                )

        try:
            response = super().post(request, *args, **kwargs)
        except Exception:
            if email:
                LoginAttempt.objects.create(email=email)
            raise

        # Successful login — wipe the failure history for this email.
        if email:
            LoginAttempt.objects.filter(email=email).delete()
        return response


class MeView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PATCH/DELETE /api/auth/me/ — the authenticated user's own profile.

    DELETE permanently removes the account. Posts, comments and workouts all
    have `on_delete=CASCADE` to the user, so deleting the row here also wipes
    everything they created — no extra queries needed. The row being gone
    (rather than soft-deleted) is also what frees up the email/username for
    a new signup."""

    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class LogoutView(APIView):
    """POST /api/auth/logout/ — body: { refresh }. Blacklists the refresh
    token so it can no longer be used to mint new access tokens."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response(
                {"detail": "Refresh token is required."}, status=status.HTTP_400_BAD_REQUEST
            )
        try:
            RefreshToken(refresh_token).blacklist()
        except TokenError:
            return Response(
                {"detail": "Invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST
            )
        return Response(status=status.HTTP_205_RESET_CONTENT)


class PasswordResetRequestView(APIView):
    """POST /api/auth/password-reset/ — body: { email }.

    Always responds 200 with the same generic message whether or not the
    email belongs to an account, so this endpoint can't be used to enumerate
    registered users. Uses Django's built-in token generator (the same one
    behind django.contrib.auth.views.PasswordResetView) to mint a token that
    a future "confirm reset" endpoint can validate with
    default_token_generator.check_token(user, token)."""

    permission_classes = [permissions.AllowAny]
    GENERIC_MESSAGE = "If an account exists with this email, a reset link has been sent."

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].strip().lower()

        user = User.objects.filter(email__iexact=email).first()
        if user is not None:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_link = f"{settings.FRONTEND_URL}/auth/reset-password?uid={uid}&token={token}"

            send_mail(
                subject="Reset your Workout Tracker password",
                message=(
                    f"Hi {user.username},\n\n"
                    "Use the link below to reset your password:\n"
                    f"{reset_link}\n\n"
                    "If you didn't request this, you can safely ignore this email."
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
            )

        return Response({"detail": self.GENERIC_MESSAGE}, status=status.HTTP_200_OK)


class PasswordResetConfirmView(APIView):
    """POST /api/auth/password-reset-confirm/ — body:
    { uid, token, new_password, new_password2 }.

    Validates the uid/token pair from the email link (same check Django's
    own password reset form does) before setting the new password. Also
    blacklists every outstanding refresh token for the user, so a device
    that already had a session (e.g. an attacker who triggered the reset
    after stealing a token) gets logged out everywhere once the real owner
    resets their password."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        for outstanding in OutstandingToken.objects.filter(user=user):
            BlacklistedToken.objects.get_or_create(token=outstanding)

        return Response(
            {"detail": "Your password has been reset. You can now log in."},
            status=status.HTTP_200_OK,
        )
