from rest_framework import serializers
from .models import User, Patient, Appointment, Inventory, Prescription


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'role', 'first_name', 'last_name', "password"]
        extra_kwargs = {
            'password': {'write_only': True}
        }


class PatientSerializer(serializers.ModelSerializer):
    user = UserSerializer(required=False)

    class Meta:
        model = Patient
        fields = '__all__'
        depth = 1

    def create(self, validated_data):
        user_data = validated_data.pop('user', None)
        if user_data:
            user = User.objects.create_user(**user_data)
            validated_data['user'] = user
        return super().create(validated_data)


class AppointmentSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.email', read_only=True)

    class Meta:
        model = Appointment
        fields = '__all__'
        extra_kwargs = {
            'patient': {'required': True},
            'date': {'required': True},
            'time': {'required': True}
        }


class InventorySerializer(serializers.ModelSerializer):
    needs_restock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Inventory
        fields = '__all__'


class PrescriptionSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.email', read_only=True)

    class Meta:
        model = Prescription
        fields = '__all__'
        read_only_fields = ('date_prescribed',)