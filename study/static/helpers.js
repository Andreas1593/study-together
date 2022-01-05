import { answerRequest, createCard, getGroups, getGroupData, getUserData, joinGroup, reloadCards,
         updateCard } from './requests.js';

var tempFront;
var tempBack;
function createCardView() {

    const $cardModal = $('#card__modal');
    const $editButton = $('#card__modal-edit', $cardModal);
    const $deleteButton = $('#card__modal-delete', $cardModal);
    const $cancelButton = $('#card__modal-cancel', $cardModal);
    const $createButton = $('#card__modal-create', $cardModal);
    const $front = $('#card__modal .flip-card-front-input');
    const $back = $('#card__modal .flip-card-back-input');
    const $modalBackground = $('.modal-backdrop');

    // Hide edit / delete buttons
    $editButton.hide();
    $deleteButton.hide();

    // Show cancel / create buttons
    $cancelButton.show();
    $createButton.show()

    // Enable writing on card
    enableWriting($cardModal);

    // Restore card text if user started writing before
    if (tempFront) {
        $front.text(tempFront);
        $back.text(tempBack);
    }
    // Else start with empty card
    else {
        $front.text('');
        $back.text('');
    }

    // Set modal background color to green
    $modalBackground.css('background-color', '#327a4d');

    // Create new card and clear card text
    $createButton.unbind().on('click', function() {
        createCard();
        $front.text('');
        $back.text('');
    });

    // Undo background change when done creating
    $cardModal.one('hide.bs.modal', function() {
        $modalBackground.css('background-color', '#000');
        tempFront = $front.text();
        tempBack = $back.text();
    });

    // Save card text when clicking outside the modal and not cancel button
    $cardModal.one('hidden.bs.modal', function() {
        tempFront = $front.text();
        tempBack = $back.text();
    });
}


function createMemberList(members) {

    const $activeGroupView = $('#activeGroup-view');
    const $memberList = $('#activeGroup__members', $activeGroupView).empty();

    members.forEach(member => {
        var $liElement = ($('<li/>', {
            class: 'list-group-item list-group-item-action list-group-item-info',
            click: function() { showUser(member) },
            text: member }))
            .appendTo($memberList);

        // Add 'Admin' text to the group admin and move him to the top
        if (member === admin) {
            $liElement.append('<span class="admin">Admin</span>');
            $liElement.prependTo($memberList);
        }
    });
}


function createRequestList(requests, group) {
    
    const $activeGroupView = $('#activeGroup-view');
    const $requestList = $('#activeGroup__requests', $activeGroupView).empty();

    requests.forEach(user => {
        var $liElement = $('<li/>', {
            class: 'list-group-item list-group-item-action list-group-item-secondary',
            click: function() { showUser(user) },
            text: user })
            .appendTo($requestList);

        // Show accept / decline buttons for admin
        if (loggedUser === admin) {
            $liElement.append($('<span/>', {
                html: '<i class="bi bi-check-circle-fill"></i>',
                click: function() {
                    answerRequest(group, user, 'ACCEPT');
                    event.stopPropagation();
                    $liElement.addClass('hide').on('animationend', function() {
                        $liElement.remove();
                    });
                },
            }));
            $liElement.append($('<span/>', {
                html: '<i class="bi bi-x-octagon-fill"></i>',
                click: function() {
                    answerRequest(group, user, 'DECLINE'),
                    event.stopPropagation();
                    $liElement.addClass('hide').on('animationend', function() {
                        $liElement.remove();
                    });
                }
            }));
        }
    });
}


function createSubjectList(subjects) {

    const $activeGroupView = $('#activeGroup-view');
    const $subjectList = $('#activeGroup__subjects', $activeGroupView).empty();

    subjects.forEach(subject => {
        $subjectList.append('<li class="list-group-item list-group-item-action ' +
                            'list-group-item-primary">' + subject + '</li>');
    });
}


function defaultCardView() {

    const $cardModal = $('#card__modal');

    // Reset card to default rotation (front)
    defaultRotation();

    // Show edit / delete button
    $('#card__modal-edit', $cardModal).show();
    $('#card__modal-delete', $cardModal).show();

    // Hide non-default buttons
    $('#card__modal-cancel', $cardModal).hide();
    $('#card__modal-create', $cardModal).hide();
    $('#correct', $cardModal).hide();
    $('#false', $cardModal).hide();
    $('#end', $cardModal).hide();

    // Hide display
    $('#display', $cardModal).hide();

    // Disable writing on card
    $('.flip-card-front-input', $cardModal).attr('contenteditable', 'false');
    $('.flip-card-back-input', $cardModal).attr('contenteditable', 'false');
    
    // Clear modal data to enable dismissing when clicking outside
    $cardModal.modal('dispose');
}


function defaultRotation() {

    var card = $('#card__modal .flip-card-inner');

    if (card.data('displayed') === 'back') {
        card.css('transform', 'rotateY(0)');
        card.data('displayed', 'front');
    }
}


function editCardView() {

    const $cardModal = $('#card__modal');
    const $editButton = $('#card__modal-edit', $cardModal);
    const $confirmButton = $('#card__modal-confirm', $cardModal);
    const $modalBackground = $('.modal-backdrop');

    enableWriting($cardModal);
    
    // Set modal background color to red
    $modalBackground.css('background-color', '#870000');

    // Hide edit button and show confirm button
    $editButton.hide();
    $confirmButton.show();

    // Update and reload card when clicking confirm
    $confirmButton.one('click', async function() {
        await updateCard();
        reloadCards();
        $cardModal.modal('hide');
    });

    // Undo changes when done editing
    $cardModal.one('hide.bs.modal', function() {
        $modalBackground.css('background-color', '#000');
        $editButton.hide();
        $confirmButton.unbind().hide();
    });
}


function enableWriting($cardModal) {

    // Enable writing on card
    $('.flip-card-front-input', $cardModal).attr('contenteditable', 'true');
    $('.flip-card-back-input', $cardModal).attr('contenteditable', 'true');

    // Focus input when clicking anyhwere on the card
    $('.flip-card-front', $cardModal).on('click', function() {
        // Move the cursor to the end of input (div)
        focusEnd($('.flip-card-front-input', $cardModal)[0]);
    });
}


function focusEnd(input) {

    var selection = window.getSelection();  
    var range = document.createRange();  
    selection.removeAllRanges();  
    range.selectNodeContents(input);  
    range.collapse(false);  
    selection.addRange(range);  
    input.focus();
}


function infoViewOnce($warningModal) {
        
    const $message = $('#warning__modal-message', $warningModal);
    const $yes = $('#warning__modal-yes', $warningModal);
    const $no = $('#warning__modal-no', $warningModal);
    const $close = $('#warning__modal-close', $warningModal)
    
    // Modify warning modal to an info modal
    $message.removeClass('red');
    $yes.hide();
    $no.hide();
    $close.show();

    // Undo changes when dismissing
    $warningModal.one('hidden.modal.bs', function() {
        $('#warning__modal-message', $warningModal).addClass('red');
        $('#warning__modal-yes', $warningModal).show();
        $('#warning__modal-no', $warningModal).show();
        $('#warning__modal-close', $warningModal).hide();
        // Additionally hide header if it was shown
        $('#warning__modal-header', $warningModal).hide();
    });
}


function handleRotation() {
    // Makes sure you can't rotate before the animation finishes

    rotateCard();

    var button = $('#card__modal i');
    $(button).unbind();
    $(button).addClass('rotate');

    $(button).on('animationend', function() {
        $(button).removeClass('rotate');
        $(button).on('click', handleRotation);
      });;
}


function populateGroupModal() {

    // Display group modal on click
    $('#group__modal').on('show.bs.modal', function(e) {

        var $group = $(e.relatedTarget);
        var groupName = $group.text();

        getGroupData(groupName).then(groupData => {

            // Fill name and number of members and subjects
            $('.modal-title', this).text(groupName);
            $('#members', this).text(groupData['members'].length);
            $('.subjects', this).text(groupData['subjects'].length);

            // Join group
            $('#group__modal-button').unbind();
            $('#group__modal-button').on('click', function() {
                joinGroup(groupName);
            });
        });
    });
}


async function reloadGroups() {

    // Fetches 'username', 'groups' and 'activeGroup'
    var userData = await getUserData('self');

    // Load the user's groups
    const groupList = $('#group__active-select').empty()
    .append('<option value="" disabled>Select a group...</option>');
    $(userData['groups']).each(function() {
        var group = $('<option/>', { html: this, value: this }).appendTo(groupList);

        // Set active group as selected option
        if (this === userData['activeGroup'][0]) {
            group.attr('selected', 'true');
        }
    });
}


function rotateCard() {

    var flipCard = $('#card__modal .flip-card-inner');

    if (flipCard.data('displayed') === 'back') {
        flipCard.css('transform', 'rotateY(0)');
        flipCard.data('displayed', 'front');
    }
    else {
        flipCard.css('transform', 'rotateY(180deg)');
        flipCard.data('displayed', 'back');
    }
}


var groups;
function searchGroup() {
    
    var query = $(this).val();

    // Fetch groups from database once on first input character
    if (query.length <= 1) {
        // All groups matching the first character
        groups = getGroups();
    }
    groups.then(groups => {

        var $list = $('#group__search-matches').empty();
        groups.forEach(group => {

            // List group if it matches the query
            if ( group.toLowerCase().includes(query.toLowerCase()) ) {

                $('<a href = "javascript:void(0)" class="list-group-item ' +
                  'list-group-item-action list-group-item-info"' +
                  'data-bs-toggle="modal" data-bs-target="#group__modal">' + group + '</a>')
                .appendTo($list);
            }
        });
    });
}


function showActiveGroup() {

    return getUserData('self').then(userData => {
        var $activeGroupElement = $('.activeGroupElement');

        // User has an active group set
        if (userData['activeGroup'].length > 0) {
            // Clear and update active group and show the nav element
            $activeGroupElement.find('span').remove();
            $activeGroupElement.children('button')
            .append('<span>' + userData['activeGroup'] + '</span>');
            $activeGroupElement.show();

            // Get logged in user and admin of the active group
            getGroupData(userData['activeGroup']).then(groupData => {
                // Global variables
                window.loggedUser = userData['username'];
                window.admin = groupData['admin'];
            });
        }
        // No active group set yet or deleted
        else {
            if ($activeGroupElement.css('display') === 'list-item') {
                $activeGroupElement.find('span').remove();
                $activeGroupElement.hide();
            }
        }
    });
}


function showCard(cardData) {

    const $cardModal = $('#card__modal');

    var front = cardData['front'];
    var back = cardData['back'];
    var id = cardData['id'];

    // Fill card texts
    $('.flip-card-front-input', $cardModal).text(front);
    $('.flip-card-back-input', $cardModal).text(back);

    // Enable editing for the creator and admin
    if (loggedUser === cardData['creator'] || loggedUser === admin) {
        $('#card__modal-edit').show().unbind().on('click', editCardView);
    }
    else {
        $('#card__modal-edit').hide();
    }

    // Enable deleting for the creator and admin
    if (loggedUser === cardData['creator'] || loggedUser === admin) {
        $('#card__modal-delete').show();
    }
    else {
        $('#card__modal-delete').hide();
    }

    // Store card id in card modal
    $cardModal.attr('data-card-id', id);
    // Store card id in card preview (depends on where the user clicks)
    if ($(event.target).hasClass('flip-card-preview')) {
        $(event.target).children().attr('data-card-id', id);
    }
    else {
        $(event.target).attr('data-card-id', id);
    }

    $cardModal.modal('toggle');
}


function showToast(message, symbol) {
// symbols: success, error, info

    var toastLiveExample = $('#liveToast');
    var toast = new bootstrap.Toast(toastLiveExample);
    $('.toast-header img').attr('src', `/static/images/${symbol}.png`);
    $('.toast-body').html(message);
    toast.show();
}


function showUser(user) {

    const $warningModal = $('#warning__modal');

    infoViewOnce($warningModal);

    $('#warning__modal-header', $warningModal).html(user).show();
    getUserData(user).then(userData => {
        var groups = userData['groups'].length;
        var dateJoined = userData['dateJoined'];

        $('#warning__modal-message', $warningModal).empty()
            .append('<div>Member in <span class="red">' + groups + '</span> groups</div>' +
            '<div class="dateJoined">Joined ' + dateJoined + '</div>')
            .removeClass('red');
        $('#warning__modal-header .modal-title', $warningModal).append('<button>Delete User</button>');

        $('#warning__modal-footer');

        // Reset warning modal view
        $warningModal.one('hidden.bs.modal', function() {
            $('#warning__modal-header', $warningModal).hide();
            $('#warning__modal-message', $warningModal).empty().addClass('red');
        });
    });

    $warningModal.modal('show');
}


export { createCardView, createMemberList, createRequestList, createSubjectList,
         defaultCardView, defaultRotation, editCardView, handleRotation, infoViewOnce,
         populateGroupModal, reloadGroups, searchGroup, showActiveGroup, showCard,
         showToast, showUser }