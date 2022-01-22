import { createCardView, createMemberList, createRequestList, createSubjectList, defaultCardView, handleRotation, populateGroupModal,
         reloadGroups, searchGroup, showActiveGroup } from './helpers.js';
import { createGroup, createSubject, deleteCard, deleteGroup, deleteSubject, getGroupData,
         getUserData, reloadCards, reloadSubjects, setActiveGroup } from './requests.js';
import { sortCards, startStudy, updateUserStats } from './study.js';


$(document).ready(async function() {

    // Use buttons to toggle between views
    $('.subjects').on('click', load_subjects);
    $('.groups').on('click', load_groups);
    $('.activeGroup').on('click', load_activeGroup);
    $('.profile').on('click', load_profile);
    
    // Clicking the navigation header also loads the main view
    $('#navbar > .bi.bi-mortarboard').on('click', load_subjects);
    $(' #navbar > span').on('click', load_subjects);

    // Clicking the username in the navigation also loads the profile view
    $('#navbar > .username > div').on('click', load_profile);

    // Show active group navbar element
    // Also check if user is the admin of the active group
    await showActiveGroup();

    // By default, load the subjects-view
    load_subjects();

    // Toggle font
    $('.change-font button').on('click', function() {
        const $body = $('body');
        if ($body.css('font-family') === '"Architects Daughter", Helvetica, cursive') {
            $body.css('font-family', 'Helvetica, cursive, "Architects Daughter"');
        }
        else {
            $body.css('font-family', '"Architects Daughter", Helvetica, cursive');
        }
    })
});


async function load_subjects() {

    changeView('subjects');

    // Hide subject create button and show message if no active group set
    if ($('.activeGroup span:first').length === 0) {
        $('#subject__create-button').hide();
        $('#subject__message').empty().append('<div>Create or join a group to create your first subject</div>')
        .addClass('m-5')
        .append('<div id="subject__message-body">All subjects of your selected group will be displayed here</div>');

    }
    else {
        $('#subject__create-button').show();
        $('#subject__message').empty().removeClass('subject__message-margin');
    }

    // Clear and reload subject list
    await reloadSubjects();
    
    // Clear input field when cancelling create
    $('#subject__modal-cancel').unbind().on('click', function() {
        $('#subject__modal-input').val('');
    });

    // Create new subject
    $('#subject__modal-create').unbind().on('click', async function() {
        createSubject();
    });

    // Show cards view
    $('.subject__button').each(function() {
        
        $(this).on('click', function() {
            load_cards($(this).text());
            // Store subject id in the subject name element
            $('#cards__name').attr('data-subject-id', $(this).attr('data-subject-id'));
        }) 
    });
}


function load_cards(subject) {

    changeView('cards');

    const $cardModal = $('#card__modal');
    
    // Show subject name
    $('#cards__name').text(subject);

    // Check if user is creator of the subject
    var creator = false;
    getUserData('self').then(userData => {
        userData['subjects'].forEach(createdSubject => {
            if (createdSubject === subject) {
                creator = true;
            }
        });

        // Delete subject
        if (creator || loggedUser === admin) {
            $('#cards__delete-button').show().unbind().on('click', function() {
                $('#warning__modal-message').html('Are you sure you want to delete this subject?');
                $('#warning__modal').modal('show');

                $('#warning__modal-yes').unbind().on('click', async function() {
                    await deleteSubject();
                    load_subjects();
                });
            });
        }
        else {
            $('#cards__delete-button').hide();
        }
    });

    // Return to subjects view
    $('#cards__back-button').unbind().on('click', function() {
        load_subjects();
    })

    // Show cards and update number of cards and winrate
    reloadCards();

    // User wants to create new card
    $('#cards__create-button').unbind().on('click', createCardView);

    // Reset card to default view when dissmissing card modal
    $cardModal.unbind().on('hidden.bs.modal', defaultCardView);

    // Rotate card on click
    $('i', $cardModal).unbind().on('click', handleRotation);

    // Delete card
    $('#card__modal-delete').unbind().on('click', async function() {
        $('#warning__modal-message').html('Are you sure you want to delete this card?');
        $('#warning__modal').modal('show');

        $('#warning__modal-yes').unbind().on('click', async function() {
            deleteCard();
        });
    });

    // Remove card text when clicking explicitly cancel
    $('#card__modal-cancel', $cardModal).unbind().on('click', function () {
        $('.flip-card-front-input', $cardModal).text('');
        $('.flip-card-back-input', $cardModal).text('');
    });

    // Start study game
    $('#cards__study-button').unbind().on('click', function() {
        sortCards().then(sortedCards => startStudy(sortedCards));
    });
}


async function load_groups() {

    changeView('groups');

    const $groupsView = $('#groups-view');

    // Clear and reload group list
    await reloadGroups();

    const $groupSelect = $('#group__active-select', $groupsView);

    // Automatically set active group if user has only 1 group
    if ($('option', $groupSelect).length === 2) {
        setActiveGroup();
        // Create or update active group navbar element
        showActiveGroup();
    }

    // Set selected group as active group
    $groupSelect.unbind().on('change', async function() {
        await setActiveGroup();
        // Create or update active group navbar element
        showActiveGroup();
    });

    // Create new group
    $('#group__create-button', $groupsView).unbind().on('click', createGroup);

    // Search group
    $('#group__search-input', $groupsView).unbind().on('input', function() {
        // List all matching groups
        searchGroup.call(this);
        // Show group data when clicking a group
        populateGroupModal();
    });
}


function load_activeGroup() {

    changeView('activeGroup');

    const $activeGroupView = $('#activeGroup-view');

    // Populate view with active group data
    getUserData('self').then(userData => {

        getGroupData(userData['activeGroup'][0])
        .then(groupData => {

            // Global variables
            window.loggedUser = userData['username'];
            window.admin = groupData['admin'];

            // Active group name
            $('#activeGroup__name', $activeGroupView).html(groupData['name']);
            // Active group admin
            $('#activeGroup__admin', $activeGroupView).html('<li class="list-group-item ' +
                'list-group-item-action list-group-item-warning">' + groupData['admin'] + '</li>');
            // Active group subjects
            createSubjectList(groupData['subjects']);
            // Active group members
            createMemberList(groupData['members']);
            // Active group join requests
            createRequestList(groupData['requests'], groupData['name']);
        });
    });

    // Delete this group
    if (loggedUser === admin) {
        $('#activeGroup__delete-button').show().unbind().on('click', function() {
            $('#warning__modal-message').html('Are you sure you want to delete this group?');
            $('#warning__modal').show();

            $('#warning__modal-yes').unbind().on('click', async function() {
                await deleteGroup();
                showActiveGroup();
                load_groups();
            });
        });
    }
    else {
        $('#activeGroup__delete-button').hide()
    }
}


function load_profile() {

    changeView('profile');

    const $profileView = $('#profile-view');

    getUserData('self').then(userData => {
        // Populate profile with user data

        $('#profile__name', $profileView).html(userData['username']);
        $('#profile__dateJoined', $profileView).html(`Member since ${userData['dateJoined']}`);

        const $groupList = $('#profile__groups', $profileView).empty();
        userData['groups'].forEach(group => {
            $('<li/>', {
                class: 'list-group-item list-group-item-action list-group-item-info',
                text: group })
                .appendTo($groupList);
            });

        updateUserStats(userData['username']);
    });
}


function changeView(view) {

    $('#subjects-view').hide();
    $('#cards-view').hide();
    $('#groups-view').hide();
    $('#activeGroup-view').hide();
    $('#profile-view').hide();

    $(`#${view}-view`).show();

    // Set active nav link (except for cards-view)
    if (view != 'cards') {
        $('.nav-link.active').removeClass('active').removeAttr('aria-current');
        $(`.${view}`).addClass('active').attr('aria-current', 'page');
    }
}


// PWA install

// Initialize deferredPrompt for use later to show browser install prompt
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt = e;
});

$('#install').on('click', async () => {
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    // We've used the prompt, and can't use it again, throw it away
    deferredPrompt = null;
  });

window.addEventListener('appinstalled', () => {
// Clear the deferredPrompt so it can be garbage collected
deferredPrompt = null;
});


export { load_cards }