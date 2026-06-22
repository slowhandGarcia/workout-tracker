from rest_framework import permissions, viewsets

from .models import Workout
from .serializers import WorkoutSerializer


class WorkoutViewSet(viewsets.ModelViewSet):
    """Full CRUD at /api/workouts/ — scoped to the authenticated user."""

    serializer_class = WorkoutSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Workout.objects.filter(user=self.request.user)
