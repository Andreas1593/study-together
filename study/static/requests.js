
import { load_cards } from './script.js';
import { reloadGroups, showCard, showToast } from './helpers.js';
import { updateWinrate } from './study.js';


function answerRequest(group, user, answer) {
    // answer can be 'ACCEPT' or 'DECLINE'

    const csrftoken = $('[name=csrfmiddlewaretoken]').val();

    // Add user to group
    fetch(`./group/${group}`, {
        method: 'PUT',
        headers: {'X-CSRFToken': csrftoken},
        body: JSON.stringify({
            user: user,
            request: answer,
        }), csrftoken,
        mode: 'same-origin',
    })
    .then(response => response.text())
    .then(response => {
        if (response === 'ACCEPTED') {
            showToast(user + ' added to ' + group, 'success');
        }
        else if (response === 'DECLINED') {
            showToast(user + "'s join request declined", 'info');
        }
        else {
            console.log(response);
        }
    });
}


function createCard() {
    
    const csrftoken = $('[name=csrfmiddlewaretoken]').val();
    const group = $('.activeGroup span:first').text();
    const subject = $('#cards__name').text();
    // Preserve line breaks and white space
    const front = $('#card__modal .flip-card-front-input').prop("innerText");
    const back = $('#card__modal .flip-card-back-input').prop("innerText");

    return fetch(`./group/${group}/${subject}`, {
        method: 'POST',
        headers: {'X-CSRFToken': csrftoken},
        body: JSON.stringify({
            front: front,
            back: back,
        }), csrftoken,
        mode: 'same-origin',
    })
    .then(response => response.text())
    .then(response => {
        // Card successfully added

        if (typeof response === 'string') {
            // Spawn new card with stylish animation
            var card = new Object();
            card.front = front;
            card.back = back;
            card.id = response;
            card.creator = loggedUser;
            $('<div/>', { class: 'col-auto p-3 py-2 p-xl-3' })
            .append($('<div/>', {
                    class: 'flip-card-preview spawn',
                    click: function() { showCard(card) } })
                    .append($('<div/>', {
                            class: 'flip-card-front-preview',
                            role: 'textbox',
                            text: front })))
                            .appendTo($('#card__box'));

            // Increase card counter
            $('#cards__count span').html(parseInt($('#cards__count span').html(), 10) + 1);

            // Show toast
            showToast('Card created', 'success');
        }
    });
}


function createGroup() {

    const csrftoken = $('[name=csrfmiddlewaretoken]').val();
    const groupName = $('#group__create-input').val();

    $('#group__create-input').val('');

    fetch(`./group/${groupName}`, {
        method: 'POST',
        headers: {'X-CSRFToken': csrftoken, 'Content-Type': 'application/json' },
        body: csrftoken,
        mode: 'same-origin',
    })
    .then(response => response.text())
    .then(response => {

        // Group successfully created
        if (response === 'CREATED') {
            $('<option/>', { html: groupName, value: groupName }).appendTo($('#group__active-select'));

            showToast(`Group <i style="color:blue">${groupName}</i> created`, 'success');
        }
        else {
            showToast('Group name already taken', 'error');
        }
    });
}


function createSubject() {

    const csrftoken = $('[name=csrfmiddlewaretoken]').val();

    // Get name of the new subject
    var subject = $('#subject__modal-input').val();
    $('#subject__modal-input').val('');

    // Create new subject
    return fetch('./subjects', {
        method: 'POST',
        headers: {'X-CSRFToken': csrftoken},
        body: JSON.stringify({
            subject: subject,
        }), csrftoken,
        mode: 'same-origin',
    })
    .then(response => response.text())
    .then(response => {

        if (response === 'TAKEN') {
            showToast('Subject already exists', 'error');
        }
        // Subject successfully created
        else {
            // Spawn subject with stylish animation
            $('<div/>', { class: 'col-auto p-2 p-xl-3' })
            .append($('<button/>', {
                    text: subject,
                    class: 'subject__button spawn',
                    'data-subject-id': response,
                    click: function() {
                        load_cards(subject);
                        $(this).removeClass('spawn');
                        $('#cards__name').attr('data-subject-id', response); } }))
                    .appendTo($('#subject__box'));

            showToast('Subject created', 'success');
        }
    });
}


function deleteCard() {

    const csrftoken = $('[name=csrfmiddlewaretoken]').val();
    const group = $('.activeGroup span:first').text();
    const subject = $('#cards__name').text();
    const id = $('#card__modal').attr('data-card-id');

    return fetch(`./group/${group}/${subject}`, {
        method: 'POST',
        headers: {'X-CSRFToken': csrftoken},
        body: JSON.stringify({
            id: id,
            request: 'DELETE',
        }), csrftoken,
        mode: 'same-origin',
    })
    .then(response => {
        // Card successfully deleted
        if (response.status === 200) {

            // Delete card with stylish animation
            const $card = $('#card__box').find(`[data-card-id='${id}']`).parent();
            const $cardContainer = $card.parent();
            $card.removeClass('spawn').addClass('despawn');
            $cardContainer.addClass('despawn-container').on('animationend', function() {
                $cardContainer.remove();
            });

            showToast('Card deleted', 'info');
        }
    });
}


function deleteGroup() {

    const csrftoken = $('[name=csrfmiddlewaretoken]').val();
    const group = $('.activeGroup span:first').text();

    // Fetch group id from group data
    return getGroupData(group).then(groupData => {

         fetch(`./group/${group}`, {
            method: 'POST',
            headers: {'X-CSRFToken': csrftoken},
            body: JSON.stringify({
                id: groupData['id'],
                request: 'DELETE',
            }), csrftoken,
            mode: 'same-origin',
        })
        .then(response => response.text())
        .then(response => {
            // Group successfully deleted
            if (response === 'DELETED') {
                showToast(`Group <i style="color:blue">${group}</i> deleted`, 'info');
            }
        });
    });
}


function deleteSubject() {

    const csrftoken = $('[name=csrfmiddlewaretoken]').val();
    const id = $('#cards__name').attr('data-subject-id');
    console.log(id)
    return fetch('./subjects', {
        method: 'POST',
        headers: {'X-CSRFToken': csrftoken},
        body: JSON.stringify({
            id: id,
            request: 'DELETE',
        }), csrftoken,
        mode: 'same-origin',
    })
    .then(response => {
        // Subject successfully deleted
        if (response.status === 200) {
            showToast('Subject deleted', 'info');
        }
    });
}


function getGroups() {

    const csrftoken = $('[name=csrfmiddlewaretoken]').val();
    const query = $('#group__search-input').val();

    return fetch('./groups', {
        method: 'POST',
        headers: {'X-CSRFToken': csrftoken},
        body: JSON.stringify({
            query: query,
        }), csrftoken,
        mode: 'same-origin',
    })
    .then(response => response.json())
    .then(matches => {
        
        return matches;
    });
}


function getGroupData(group) {

    return fetch(`./group/${group}`, {
        method: 'GET',
    })
    .then(response => response.json())
    .then(groupData => {
        return groupData;
    });
}


function getUserData(user) {
    // User 'self' = requesting user

    return fetch(`./user/${user}`, {
        method: 'GET',
    })
    .then(response => response.json())
    .then(userData => {
        return userData
    });
}


function joinGroup(groupName) {

    const csrftoken = $('[name=csrfmiddlewaretoken]').val();

    // Send join request
    fetch(`./group/${groupName}`, {
        method: 'PUT',
        headers: {'X-CSRFToken': csrftoken},
        mode: 'same-origin',
    })
    .then(response => response.text())
    .then(response => {
        if (response === 'SENT') {
            showToast('Join request sent', 'success');
            reloadGroups();
        }
        else if (response === 'MEMBER') {
            showToast('You are already member of this group', 'error');
        }
        else if (response === 'ADMIN') {
            showToast('You are already admin of this group', 'error');
        }
        else if (response === 'PENDING') {
            showToast('You have already a pending join request', 'info');
        }
        else {
            console.log(response);
        }
    });
}


function reloadCards() {

    const group = $('.activeGroup span:first').text();
    const subject = $('#cards__name').text();

    // Clear card list
    $('#card__box').empty();

    // Clear number of cards
    $('#cards__count span').html(0);

    // Show number of cards
    updateWinrate(group, subject);

    // Update card list
    return fetch(`./group/${group}/${subject}`, {
        method: 'GET',
    })
    .then(response => response.json())
    .then(cards => {
        cards.forEach(card => {

            // Create and add cards
            $('<div/>', { class: 'col-auto p-3 py-2 p-xl-3' })
            .append($('<div/>', {
                    class: 'flip-card-preview',
                    click: function() { showCard(card) } })
                    .append($('<div/>', {
                            class: 'flip-card-front-preview',
                            role: 'textbox',
                            text: card['front'] })))
                            .appendTo($('#card__box'));
            
            // Count the number of cards
            $('#cards__count span').html(parseInt($('#cards__count span').html(), 10) + 1);
        });

        // Hide 'Study' button if no cards in this subject
        if (cards.length === 0) {
            $('#cards__study-button').prop('disabled', true).css({
                'background-color': '#ffc107a0',
                'color': '#000000a0',
            });
        }
        else {
            $('#cards__study-button').prop('disabled', false).css({
                'background-color': '#ffc107',
                'color': '#000000',
            });
        }
    });
}


function reloadSubjects() {

    // Clear subject list
    $('#subject__box').children().not(':first').remove();

    // Update subject list
    return fetch('./subjects', {
        method: 'GET',
    })
    .then(response => response.json())
    .then(subjects => {
        subjects.forEach(subject => {

            if (subject['message'] === 'No active group') {
                return
            }
            else if (subject['message'] === 'No subjects') {
                return
            }

            // Create and add subject buttons
            else {
                $('<div/>', { class: 'col-auto p-2 p-xl-3' })
                .append($('<button/>', {
                        text: subject['name'],
                        class: 'subject__button',
                        'data-subject-id': subject['id'] }))
                        .appendTo($('#subject__box'));
            }
        });
    });
}


function setActiveGroup() {

    const csrftoken = $('[name=csrfmiddlewaretoken]').val();
    const activeGroup = $('#group__active-select').val();

    return fetch('./user/self', {
        method: 'PUT',
        headers: {'X-CSRFToken': csrftoken},
        body: JSON.stringify({
            activeGroup: activeGroup,
        }), csrftoken,
        mode: 'same-origin',
    })
    .then(response => {
        // Group successfully set as active group
        if (response.status === 201) {
            showToast(`Group <i style="color:blue">${activeGroup}</i> set as active group`, 'success');
        }
    });
}


function updateCard() {

    const csrftoken = $('[name=csrfmiddlewaretoken]').val();
    const group = $('.activeGroup span:first').text();
    const subject = $('#cards__name').text();
    // Preserve line breaks and white space
    const front = $('#card__modal .flip-card-front-input').prop("innerText");
    const back = $('#card__modal .flip-card-back-input').prop("innerText");
    const id = $('#card__modal').attr('data-card-id');

    return fetch(`./group/${group}/${subject}`, {
        method: 'PUT',
        headers: {'X-CSRFToken': csrftoken},
        body: JSON.stringify({
            front: front,
            back: back,
            id: id,
        }), csrftoken,
        mode: 'same-origin',
    })
    .then(response => {
        // Card successfully updated
        if (response.status === 201) {
            console.log('Card updated');
        }
    });
}


export { answerRequest, createCard, createGroup, createSubject, deleteCard, deleteGroup, deleteSubject, getGroups,
         getGroupData, getUserData, joinGroup, reloadCards, reloadSubjects, setActiveGroup, updateCard }