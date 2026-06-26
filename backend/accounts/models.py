from django.contrib.auth.models import AbstractUser
from django.db import models


class LoginAttempt(models.Model):
    """One row per failed login attempt. Used to enforce per-email rate limits
    without Redis — the DB is the shared store that works across all workers."""

    email = models.EmailField(db_index=True)
    attempted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["email", "attempted_at"])]


class User(AbstractUser):
    """Custom user: login is by email, but `username` is kept as the
    public display name shown throughout the app (profile, posts, etc.)."""

    email = models.EmailField("email address", unique=True)
    bio = models.CharField(max_length=280, blank=True, default="")
    location = models.CharField(max_length=120, blank=True, default="")
    avatar_url = models.URLField(blank=True, default="")

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def __str__(self):
        return self.email
