# Study together!
#### URL: https://studytogetherapp.herokuapp.com/

![Screnshot 'Study'](https://github.com/Andreas1593/CS50W/blob/Final-Project/finalproject/study/static/images/study.gif?raw=true)

![Screenshot mobile](https://github.com/Andreas1593/CS50W/blob/Final-Project/finalproject/study/static/images/mobile.gif?raw=true)

#### Description:

##### General

My final project for CS50's Web Programming with Python and JavaScript is a progressive single-page web application called "Study together!".


##### Basic concept

Often people learn the same material as others because they're in the same class. Therefore, it can be useful to have a shared pool of index cards and an app that remembers which cards are more difficult for you. Studying together is more fun.

##### Study concept

The user creates subjects for which he creates index cards.
By pressing the "Study" button, he's shown one card from that subject at a time. The cards are sorted in a special way. First come cards that he has never seen before, the rest are sorted according to how many times he answered them incorrectly.
There are buttons to flip the card around to see the answer and to confirm whether he knew the answer or not. If he did, the card is removed from the stack and the next card is shown. If he didn't know the answer, the card is placed "under the stack" and the next card is shown.
Once all cards are answered correctly or the user decides to end studying, he will see how many cards he answered correctly on the first try as well as his overall rate of correct answers on the first try.

##### Group concept

The main aspect of the app that motivates users in studying is that it's all based on groups. Users can be members of several groups, each of which shares common subjects and cards.
The user must create or join a group before he can create a subject. He can search for groups and send join requests. Once he's been accepted, the group shows up under his list of groups. After setting it as his active group, all its subjects and cards will be visible for him. He can immediately start adding new subjects, cards or just studying the existing cards.

##### Distinctiveness and Complexity

The app satisfies the prescribed distinctiveness and complexity requirements.
It makes use of the main techniques taught in the course without being a simple copy of one of the projects before. The concept is completely different from the other projects and requires a good balance of front-end and back-end development.
Multiple Django-Models with relations with each other were created to implement the ideas of groups containing subjects containing cards and users having stats for every card and subject.
Being a single-page application, many AJAX calls are made continuously. Implementing the frontend- / backend-communication was a complex task regarding the asynchronous behavior of javascript.
Quite some effort was also put into the CSS styling using bootstrap, creating custom animations and making the app mobile-responsive with an alternate navigation bar.

##### Files explained

###### models.py

Contains the classes *User*, *Group*, *JoinRequest*, *ActiveGroup*, *Subject*, *Card* and *Stats*.

###### urls.py

There are only the index route and the login / logout / register routes as "real" routes. Most of the routes serve as API.

###### views.py

The main work done in the backend is handling API requests and serving requested data or inserting data into the database. Often checks are done before responding, e.g. whether a name is available or an instance exists. Sorting the cards when the user wants to study is also done there.

###### script.js

The main file of the app. Handles the different views which are the subjects-view (default), cards-view, groups-view, active-group-view and profile-view. A single card is displayed via modified bootstrap modal.

###### helpers.js

This file is even larger than script.js, because it contains the logic that is handled in the different views, outsourced into own functions. Often these are functions that are triggered by a click event.

###### requests.js

Contains supporting functions like helpers.js, but only those that send API requests. They were outsourced for the sake of clarity. The file is still as large as helpers.js.

###### study.js

Contains everything that happens when the user clicks the "Study" button, basically the logic of the study "game". Related API requests are also included.

##### How to run

All that's required to run the app is Django and Python, of course.
After registration you can use the app to its full extend.
