import json
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import AnonymousUser
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse

from .models import *


def index(request):

    # Authenticated users view their inbox
    if request.user.is_authenticated:
        return render(request, "index.html", {
            "user": request.user,
        })

    # Everyone else is prompted to sign in
    else:
        return HttpResponseRedirect(reverse("login"))



def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):

    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Check username requirements
        if len(username) < 6:
            return render(request, "register.html", {
                "message": "Username must contain at least 6 characters."
            })
        if User.objects.filter(username=username).exists():
            return render(request, "register.html", {
                "message": "Username already taken."
            })

        # Check password requirements
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "register.html", {
                "message": "Passwords must match."
            })
        else:
            if len(password) < 6:
                return render(request, "register.html", {
                    "message": "Password must contain at least 6 characters."
                })

        # Check email requirements
        if len(email) > 0:
            if "@" not in email or "." not in email:
                return render(request, "register.html", {
                    "message": "Invalid email address."
                })
            if User.objects.filter(email=email).exists():
                return render(request, "register.html", {
                    "message": "Email address already taken."
                })
            
        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError as e:
            print(e)
            return render(request, "register.html", {
                "message": "There was an error creating your account."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
        
    else:
        return render(request, "register.html")


# API to display or create cards
def cards(request, groupName, subjectName):

    if request.method == "GET":
        # Display all cards of this group

        group = Group.objects.get(name=groupName)
        subject = Subject.objects.get(group=group, name=subjectName)
        cards = subject.Cards.all()
        return JsonResponse([card.serialize() for card in cards], safe=False)

    elif request.method == "POST":
        data = json.loads(request.body)

        # Delete card
        if data.get("request") is not None:
            if data["request"] == "DELETE":
                id = data["id"]
                Card.objects.filter(id=id).delete()
                return HttpResponse(status=200)

        # Create new card
        elif data.get("front") is not None:
            front = data["front"]
            back = data["back"]
        group = Group.objects.get(name=groupName)
        subject = Subject.objects.get(group=group, name=subjectName)
        creator = request.user

        card = Card(front=front, back=back, subject=subject, creator=creator)
        card.save() 
        return HttpResponse(card.id)

    elif request.method == "PUT":
        # Update card

        data = json.loads(request.body)
        if data.get("id") is not None:
            id = data["id"]
        card = Card.objects.get(id=id)
        card.front = data["front"]
        card.back = data["back"]
        card.save()
        return HttpResponse(status=201)


# API for specific group requests
def group(request, groupName):

    # Return group data
    if request.method == "GET":
        group = Group.objects.get(name=groupName)
        return JsonResponse(group.serialize(), safe=False)

    # Create new group
    elif request.method == "POST":

        # Delete subject
        try:
            data = json.loads(request.body)
        except:
            data = {}
        if data.get("request") is not None:
            if data["request"] == "DELETE":
                id = data["id"]
                Group.objects.filter(id=id).delete()
                return HttpResponse("DELETED")

        # Check if there's already a group with that name
        else:
            groups = Group.objects.all()
            for group in groups:
                if groupName.lower() == group.name.lower():
                    return HttpResponse("TAKEN")
            
        # Group name available, create new group
        group = Group(name=groupName, admin=request.user)
        group.save()
        group.users.add(request.user)
        return HttpResponse("CREATED")

    # Add user to group
    elif request.method == "PUT":
        user = request.user
        group = Group.objects.get(name=groupName)

        # Admin responds to a join request
        if user == group.admin:
            try:
                data = json.loads(request.body)
            except:
                data = {}
            if data.get("request") is not None:

                # Add new member to group and delete join request
                if data["request"] == "ACCEPT":
                    newMember = User.objects.get(username=data["user"])
                    group.users.add(newMember)
                    request = JoinRequest.objects.filter(group=group, user=newMember)
                    request.delete()
                    return HttpResponse("ACCEPTED")

                # Don't add new member to group and delete join request
                if data["request"] == "DECLINE":
                    newMember = User.objects.get(username=data["user"])
                    request = JoinRequest.objects.filter(group=group, user=newMember)
                    request.delete()
                    return HttpResponse("DECLINED")
            
            # Admin tries to join his own group, don't add
            else:
                return HttpResponse("ADMIN")
                


        # User sends a join request
        else:
            # User already in group, don't add
            if group.users.filter(username=user.username).exists():
                return HttpResponse("MEMBER")

            # User has a pending join request
            elif JoinRequest.objects.filter(group=group, user=user).exists():
                return HttpResponse("PENDING")

            # Create join request
            else:
                request = JoinRequest(group=group, user=user)
                request.save()
                return HttpResponse("SENT")


# API to return all groups matching the query
def groups(request):
    # First character is processed server-side and returns matches
    # Following characters are processed client-side

    if request.method == "POST":

        data = json.loads(request.body)
        if data.get("query") is not None:
            query = data["query"]

        # Return dict with all groups matching the query
        matches = []
        groups = Group.objects.all()
        for group in groups:
            # Query not empty (backspace) and substring of group
            if query and query.lower() in group.name.lower():
                matches.append(group.name)

        return JsonResponse(matches, safe=False)


def study(request, groupName, subjectName):

    user = request.user
    group = Group.objects.get(name=groupName)
    subject = Subject.objects.get(group=group, name=subjectName)
    cards = Card.objects.filter(subject=subject)

    if request.method == "GET":
        # Return cards sorted:
        # First unplayed cards, then less frequently correct to correct cards

        unplayedCards = []
        playedCards = []

        for card in cards:
            currentCard = card.Stats.all()
            if not currentCard:
                currentCard = Stats(user=user, card=card, subject=subject)
            else:
                currentCard = currentCard[0]

            # Sort unplayed cards out
            if currentCard.tries == 0:
                unplayedCards.append(currentCard)
            else:
                playedCards.append(currentCard)

        # Sort played cards by their winrate
        def calcRate(stats):
            return stats.points / stats.tries
        playedCards.sort(key=calcRate)

        # Concatenate both lists
        sortedCards = unplayedCards + playedCards

        # Swap stats for cards
        for i in range(len(sortedCards)):
            sortedCards[i] = sortedCards[i].card

        return JsonResponse([card.serialize() for card in sortedCards], safe=False)

    elif request.method == "POST":
        # Update stats

        data = json.loads(request.body)

        if data.get("id") is not None:
            id = data["id"]
            card = Card.objects.get(id=id)

            # Update stats
            if user.Stats.filter(card=card).exists():
                stats = user.Stats.filter(card=card)[0]
                stats.tries += 1

                if data["answer"] == "CORRECT":
                    stats.points += 1
                    stats.save()
                    return HttpResponse(status=200)
                else:
                    stats.save()
                    return HttpResponse(status=200)

            # Create stats
            else:
                stats = Stats(user=user, card=card, subject=subject)
                stats.tries += 1

                if data["answer"] == "CORRECT":
                    stats.points += 1
                    stats.save()
                    return HttpResponse(status=200)
                else:
                    stats.save()
                    return HttpResponse(status=200)

    elif request.method == "PUT":
        # Update winrate

        data = json.loads(request.body)

        if data.get("id") is not None:
            id = data["id"]        


# API to fetch all subjects of the group and create new subject
def subjects(request):

    # Get active group - do nothing if no active group set
    try:
        activeGroup = request.user.ActiveGroup.all()[0]
    except:
        activeGroup = None
    if not activeGroup:
        return JsonResponse([{"message": "No active group"}], safe=False)

    if request.method == "POST":
        data = json.loads(request.body)

        # Delete subject
        if data.get("request") is not None:
            if data["request"] == "DELETE":
                id = data["id"]
                Subject.objects.filter(id=id).delete()
                return HttpResponse(status=200)

        # Create new subject
        elif data.get("subject") is not None:
            subjectName = data["subject"].strip()
        group = activeGroup.group

        # Check if there's already a subject with that name
        subjects = Subject.objects.filter(group=group)
        for subject in subjects:
            if subjectName.lower() == subject.name.lower():
                return HttpResponse("TAKEN")
        # Subject name available, create new subject
        else:
            newSubject = Subject(group=group, name=subjectName, creator=request.user)
            newSubject.save()
            return HttpResponse(newSubject.id)

    elif request.method == "GET":
        # Display all subjects of this group

        subjects = activeGroup.group.Subjects.all()
        if subjects:
            return JsonResponse([subject.serialize() for subject in subjects], safe=False)
        else:
            return JsonResponse([{"message": "No subjects"}], safe=False)


# API to fetch user data and update active group
def user(request, username):
    
    if (username == "self"):
        user = request.user
    else:
        user = User.objects.get(username=username)

    if request.method == "GET":
        # AnonymousUser can't be serialized
        try:
            return JsonResponse(user.serialize(), safe=False)
        except:
            return JsonResponse({'activeGroup': []})

    elif request.method == "PUT":
        # Set selected group as active group

        data = json.loads(request.body)
        if data.get("activeGroup") is not None:
            selectedGroupName = data["activeGroup"]
            selectedGroup = Group.objects.get(name=selectedGroupName)

        activeGroup = user.ActiveGroup.all()
        # Empty QuerySet - no active group set yet
        if not activeGroup:
            activeGroup = ActiveGroup(user=user, group=selectedGroup)
            activeGroup.save()
        else:
            # Set new active group
            activeGroup = activeGroup[0]
            activeGroup.group = selectedGroup
            activeGroup.save()

        return HttpResponse(status=201)


# API to fetch the user's total winrate
def stats(request):

    if request.method == "GET":

        user = request.user
        stats = user.Stats.all()

        totalCards = user.Stats.all()
        totalTries = 0
        for card in totalCards:
            totalTries += card.tries
        
        tries = 0
        points = 0
        for stat in stats:
            tries += stat.tries
            points += stat.points
        if tries:
            winrate = round(points / tries * 100)
        else:
            winrate = 0
        
        return JsonResponse({"answeredCards": totalTries, "winrate": winrate})


# API to fetch the user's winrate in a subject
def winrateSubject(request, groupName, subjectName):

    if request.method == "GET":

        user = request.user
        group = Group.objects.get(name=groupName)
        subject = Subject.objects.get(group=group, name=subjectName)
        stats = user.Stats.filter(subject=subject)
        
        tries = 0
        points = 0

        for stat in stats:
            tries += stat.tries
            points += stat.points
        
        if tries == 0:
            return HttpResponse(0)
        else:
            winrate = round(points / tries * 100)
            return HttpResponse(winrate)


def base_layout(request):
	template='layout.html'
	return render(request,template)