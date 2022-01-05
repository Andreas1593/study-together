from django.contrib.auth.models import AbstractUser
from django.db import models

# Create your models here.
class User(AbstractUser):
    def serialize(self):
        return {
            "username": self.username,
            "groups": [group.name for group in self.Groups.all()],
            "activeGroup": [activeGroup.group.name for activeGroup in self.ActiveGroup.all()],
            "dateJoined": self.date_joined.strftime("%b %d %Y"),
            "subjects": [subject.name for subject in self.Subjects.all()],
        } 

class Group(models.Model):
    name = models.TextField(max_length=64, blank=False)
    admin = models.ForeignKey(User, on_delete=models.CASCADE, related_name="Admins")
    users = models.ManyToManyField(User, related_name="Groups")
    
    def serialize(self):
        return {
            "id": self.id,
            "name": self.name,
            "admin": self.admin.username,
            "members": [user.username for user in self.users.all()],
            "subjects": [subject.name for subject in self.Subjects.all()],
            "requests": [request.user.username for request in self.Requests.all()],
        } 

class JoinRequest(models.Model):
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name="Requests")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="Requests")

class ActiveGroup(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="ActiveGroup")
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name="ActiveUser")

class Subject(models.Model):
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name="Subjects")
    name = models.TextField(max_length=64, blank=False)
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name="Subjects")
    timestamp = models.DateTimeField(auto_now_add=True)

    def serialize(self):
        return {
            "id": self.id,
            "group": self.group.name,
            "name": self.name,
            "creator": self.creator.username,
            "timestamp": self.timestamp.strftime("%b %d %Y, %I:%M %p"),
        }

class Card(models.Model):
    front = models.TextField(max_length=80, blank=False)
    back = models.TextField(max_length=250, blank=False)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name="Cards")
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name="Cards")
    timestamp = models.DateTimeField(auto_now_add=True)

    def serialize(self):
        return {
            "id": self.id,
            "group": self.subject.group.name,
            "subject": self.subject.name,
            "front": self.front,
            "back": self.back,
            "creator": self.creator.username,
            "timestamp": self.timestamp.strftime("%b %d %Y, %I:%M %p"),
        }

class Stats(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="Stats")
    card = models.ForeignKey(Card, on_delete=models.CASCADE, related_name="Stats")
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name="Stats")
    tries = models.IntegerField(blank=False, default=0)
    points = models.IntegerField(blank=False, default=0)