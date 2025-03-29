from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.http import JsonResponse
from rest_framework.views import APIView
from django.utils import timezone
from datetime import datetime, timedelta, time as dt_time

from .models import User, Patient, Appointment, Inventory, Prescription
from .serializers import (
    UserSerializer, PatientSerializer,
    AppointmentSerializer, InventorySerializer,
    PrescriptionSerializer)


def get_modules(request):
    modules = {"modules": ["Patients", "Appointments", "Inventory", "Reports", "Prescriptions"]}
    return JsonResponse(modules)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        data = request.data
        if "password" in data:
            data["password"] = make_password(data["password"])

        serializer = self.get_serializer(data=data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        name = self.request.query_params.get('name')
        if name:
            queryset = queryset.filter(name__icontains=name)
        return queryset


class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        data = request.data
        date = data.get("date")
        time = data.get("time")
        patient_name = data.get("patient_name")
        doctor_id = data.get("doctor")
        patient_age = data.get("age", 0)

        if not date or not time or not patient_name:
            return Response({"error": "Missing required fields"}, status=status.HTTP_400_BAD_REQUEST)

        patient, created = Patient.objects.get_or_create(
            name=patient_name,
            defaults={"age": patient_age}
        )

        appointment = Appointment.objects.create(
            date=date,
            time=time,
            patient=patient,
            doctor_id=doctor_id if doctor_id else None,
        )

        serializer = AppointmentSerializer(appointment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def get_queryset(self):
        queryset = super().get_queryset()
        date = self.request.query_params.get('date')
        patient_id = self.request.query_params.get('patient_id')
        doctor_id = self.request.query_params.get('doctor_id')

        if date:
            queryset = queryset.filter(date=date)
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
        if doctor_id:
            queryset = queryset.filter(doctor_id=doctor_id)
        return queryset


class InventoryViewSet(viewsets.ModelViewSet):
    queryset = Inventory.objects.all()
    serializer_class = InventorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        needs_restock = self.request.query_params.get('needs_restock')
        if needs_restock and needs_restock.lower() == 'true':
            queryset = queryset.filter(quantity__lte=models.F('threshold'))
        return queryset


class PrescriptionViewSet(viewsets.ModelViewSet):
    queryset = Prescription.objects.all()
    serializer_class = PrescriptionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        patient_id = self.request.query_params.get('patient_id')
        doctor_id = self.request.query_params.get('doctor_id')
        active = self.request.query_params.get('active')

        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
        if doctor_id:
            queryset = queryset.filter(doctor_id=doctor_id)
        if active and active.lower() == 'true':
            queryset = queryset.filter(is_active=True)
        return queryset


class DoctorAvailabilityView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, doctor_id):
        date_str = request.query_params.get('date')
        if not date_str:
            return Response({'error': 'Date parameter required'}, status=400)

        try:
            date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': 'Invalid date format. Use YYYY-MM-DD'}, status=400)

        # Standard working hours
        start_time = dt_time(9, 0)  # 9 AM
        end_time = dt_time(17, 0)  # 5 PM

        # Get existing appointments
        booked_slots = Appointment.objects.filter(
            doctor_id=doctor_id,
            date=date
        ).values_list('time', flat=True)

        slots = []
        current_time = datetime.combine(date, start_time)
        end_datetime = datetime.combine(date, end_time)

        while current_time < end_datetime:
            slot_time = current_time.time()
            if slot_time not in booked_slots:
                slots.append(slot_time.strftime('%H:%M'))
            current_time += timedelta(minutes=30)

        return Response({
            'doctor_id': doctor_id,
            'date': date_str,
            'available_slots': slots
        })