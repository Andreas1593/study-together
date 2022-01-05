from django.contrib import admin
from .models import *

# Register your models here.
admin.site.register(User)
admin.site.register(Group)
admin.site.register(JoinRequest)
admin.site.register(ActiveGroup)
admin.site.register(Subject)
admin.site.register(Card)
admin.site.register(Stats)