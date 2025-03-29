from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models.functions import TruncMonth, TruncDay
from django.db.models import Count, Sum, Case, When, IntegerField
from .models import User, Inventory, Prescription, Appointment

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_registration_report(request):
    """Report on user registrations over time (monthly)."""
    stats = (
        User.objects.annotate(month=TruncMonth("date_joined"))
        .values("month", "role")
        .annotate(count=Count("id"))
        .order_by("month")
    )
    return Response(stats)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def inventory_report(request):
    """Report on current inventory stock levels."""
    stats = Inventory.objects.annotate(
        status=Case(
            When(quantity__lte=models.F('threshold'), then=models.Value('Needs Restock')),
            default=models.Value('OK'),
            output_field=models.CharField()
        )
    ).values('medicine_name', 'quantity', 'threshold', 'status')
    return Response(stats)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def prescription_report(request):
    """Report on prescriptions by medication"""
    stats = (
        Prescription.objects.values('medication')
        .annotate(
            count=Count('id'),
            patients=Count('patient', distinct=True),
            active=Sum(Case(
                When(is_active=True, then=1),
                default=0,
                output_field=IntegerField()
            ))
        )
        .order_by('-count')
    )
    return Response(stats)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def appointment_report(request):
    """Report on appointment trends"""
    stats = (
        Appointment.objects.annotate(
            month=TruncMonth('date'),
            status_group=Case(
                When(status='completed', then=models.Value('Completed')),
                When(status='cancelled', then=models.Value('Cancelled')),
                default=models.Value('Scheduled'),
                output_field=models.CharField()
            )
        )
        .values('month', 'status_group')
        .annotate(count=Count('id'))
        .order_by('month')
    )
    return Response(stats)