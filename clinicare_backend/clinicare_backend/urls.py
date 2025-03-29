from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from api.views import (
    UserViewSet, PatientViewSet,
    AppointmentViewSet, InventoryViewSet,
    PrescriptionViewSet, DoctorAvailabilityView,
    get_modules
)
from api.reports import (
    user_registration_report,
    inventory_report,
    prescription_report,
    appointment_report
)
from rest_framework_simplejwt.views import TokenRefreshView
from api.views_auth import CustomTokenObtainPairView

router = DefaultRouter()
router.register(r'users', UserViewSet, basename="users")
router.register(r'patients', PatientViewSet, basename="patients")
router.register(r'appointments', AppointmentViewSet, basename="appointments")
router.register(r'inventory', InventoryViewSet, basename="inventory")
router.register(r'prescriptions', PrescriptionViewSet, basename="prescriptions")

urlpatterns = [
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path("api/", include(router.urls)),
    path("api/doctors/<int:doctor_id>/availability/",
         DoctorAvailabilityView.as_view(),
         name='doctor-availability'),
    path("api/reports/users/", user_registration_report, name="user_reports"),
    path("api/reports/inventory/", inventory_report, name="inventory_reports"),
    path("api/reports/prescriptions/", prescription_report, name="prescription_reports"),
    path("api/reports/appointments/", appointment_report, name="appointment_reports"),
    path("admin/", admin.site.urls),
    path("api/modules/", get_modules, name="get_modules"),
]