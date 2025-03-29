from django.contrib import admin
from .models import User, Patient, Appointment, Inventory, Prescription


class InventoryAdmin(admin.ModelAdmin):
    list_display = ('medicine_name', 'quantity', 'threshold', 'expiry_date', 'needs_restock')
    list_filter = ('medicine_name',)
    search_fields = ('medicine_name',)
    date_hierarchy = 'expiry_date'

    def needs_restock(self, obj):
        return obj.quantity <= obj.threshold

    needs_restock.boolean = True
    needs_restock.short_description = 'Needs Restock'


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'role', 'is_active')
    list_filter = ('role', 'is_active')
    search_fields = ('email', 'first_name', 'last_name')


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ('name', 'age', 'gender', 'blood_type')
    list_filter = ('gender', 'blood_type')
    search_fields = ('name', 'contact', 'insurance_id')
    raw_id_fields = ('user',)


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('patient', 'doctor', 'date', 'time', 'status')
    list_filter = ('status', 'date', 'doctor')
    search_fields = ('patient__name', 'doctor__email')
    date_hierarchy = 'date'


@admin.register(Prescription)
class PrescriptionAdmin(admin.ModelAdmin):
    list_display = ('medication', 'patient', 'doctor', 'date_prescribed', 'is_active')
    list_filter = ('is_active', 'doctor')
    search_fields = ('medication', 'patient__name')
    date_hierarchy = 'date_prescribed'


admin.site.register(Inventory, InventoryAdmin)