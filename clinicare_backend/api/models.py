import datetime
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


def default_time():
    return "12:00:00"


class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required for all users")
        email = self.normalize_email(email)
        extra_fields.setdefault("is_active", True)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", "admin")

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('doctor', 'Doctor'),
        ('nurse', 'Nurse'),
        ('staff', 'Staff'),
        ('patient', 'Patient'),
    ]

    username = None
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='patient')

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['role']

    objects = CustomUserManager()

    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"
        ordering = ["email"]


class Patient(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True)
    name = models.CharField(max_length=255, default="unknown")
    age = models.PositiveIntegerField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=[('Male', 'Male'), ('Female', 'Female')], null=True, blank=True)
    contact = models.CharField(max_length=20, null=True, blank=True)
    medical_history = models.TextField(blank=True, null=True)
    blood_type = models.CharField(max_length=3, blank=True, choices=[
        ('A+', 'A+'), ('A-', 'A-'),
        ('B+', 'B+'), ('B-', 'B-'),
        ('AB+', 'AB+'), ('AB-', 'AB-'),
        ('O+', 'O+'), ('O-', 'O-')
    ])
    allergies = models.TextField(blank=True)
    chronic_conditions = models.TextField(blank=True)
    last_physical = models.DateField(null=True, blank=True)
    insurance_provider = models.CharField(max_length=100, blank=True)
    insurance_id = models.CharField(max_length=50, blank=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Patient"
        verbose_name_plural = "Patients"
        ordering = ["name"]


class Appointment(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="appointments")
    date = models.DateField()
    time = models.TimeField(default=default_time, null=True, blank=True)
    doctor = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        limit_choices_to={'role': 'doctor'}, related_name="doctor_appointments"
    )
    notes = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, default='scheduled', choices=[
        ('scheduled', 'Scheduled'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled')
    ])

    def __str__(self):
        doctor_name = self.doctor.email if self.doctor else "Unassigned"
        return f"Appointment: {self.patient.name} with Dr. {doctor_name} on {self.date} at {self.time}"

    class Meta:
        verbose_name = "Appointment"
        verbose_name_plural = "Appointments"
        ordering = ["-date", "time"]


class Prescription(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='prescriptions')
    doctor = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'role': 'doctor'})
    medication = models.CharField(max_length=255)
    dosage = models.CharField(max_length=100)
    instructions = models.TextField()
    date_prescribed = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.medication} for {self.patient.name}"

    class Meta:
        ordering = ['-date_prescribed']


class Inventory(models.Model):
    medicine_name = models.CharField(max_length=100)
    quantity = models.PositiveIntegerField()
    expiry_date = models.DateField()
    threshold = models.PositiveIntegerField(default=10, help_text="Minimum quantity before restock alert")

    def __str__(self):
        return f"{self.medicine_name} - {self.quantity} units (Exp: {self.expiry_date})"

    @property
    def needs_restock(self):
        return self.quantity <= self.threshold

    class Meta:
        verbose_name = "Inventory Item"
        verbose_name_plural = "Inventory"
        ordering = ["expiry_date"]