from rest_framework import permissions


class IsOwnerOrReadOnly(permissions.BasePermission):
    """Allow read access to all; write only to the object's owner."""

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.posted_by == request.user


class IsEmployer(permissions.BasePermission):
    """Allow write actions only to authenticated users with role EMPLOYER."""

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, 'role', None) == 'EMPLOYER'
        )


class IsJobSeeker(permissions.BasePermission):
    """Allow access only to authenticated JOB_SEEKER users."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, 'role', None) == 'JOB_SEEKER'
        )


class IsEmployerAndOwnerOrReadOnly(permissions.BasePermission):
    """
    - Safe methods (GET, HEAD, OPTIONS): allow anyone.
    - Unsafe methods (POST, PUT, PATCH, DELETE): require the user to be an
      authenticated EMPLOYER who owns the job.
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, 'role', None) == 'EMPLOYER'   # fixed case
        )

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.company == request.user
