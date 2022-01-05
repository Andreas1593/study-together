import { defaultRotation, infoViewOnce } from './helpers.js';

function pulseElement($element) {

    // Display needs special class bc of x-translation property
    if ($element.attr('id') === 'display') {
        $element.addClass('pulse-display').on('animationend', function() {
            $element.removeClass('pulse-display');
        });
    }
    else {
        $element.addClass('pulse').on('animationend', function() {
            $element.removeClass('pulse');
        });
    }
}


function endStudy($cardModal, playedCards, correctCards) {
    // Setup warning modal with result message

    $cardModal.modal('hide');

    const $warningModal = $('#warning__modal');

    const rate = Number((correctCards / playedCards).toFixed(2));

    if (playedCards == 0) {
        return;
    }
    else if (playedCards === 1 && rate === 1) {
        $('#warning__modal-message', $warningModal).html(`Nice Job!\n You answered ` +
        `${correctCards} out of ${playedCards} card correctly on the first try.`);
    }
    else if (playedCards === 1 && rate === 0) {
        $('#warning__modal-message', $warningModal).html(`You can do better!\n You answered ` +
        `${correctCards} out of ${playedCards} card correctly on the first try.`);
    }
    else if (rate < 0.33) {
        $('#warning__modal-message', $warningModal).html(`You can do better!\n You answered ` +
        `${correctCards} out of ${playedCards} cards correctly on the first try.`);
    }
    else {
        $('#warning__modal-message', $warningModal).html(`Nice Job!\n You answered ` +
            `${correctCards} out of ${playedCards} cards correctly on the first try.`);
    }

    // Modify warning modal to an info modal and reset to default view when dismissing
    infoViewOnce($warningModal);

    $warningModal.modal('show');
}


function updateUserStats() {

    return fetch('./stats', {
        method: 'GET',
    })
    .then(response => response.json())
    .then(stats => {
        $('#profile__total').html(stats['answeredCards']);
        $('#profile__rate').html(stats['winrate'] + '%');
    });
}


function sortCards() {

    const group = $('.activeGroup span:first').text();
    const subject = $('#cards__name').text();
    console.log("sortCards")
    return fetch(`./study/${group}/${subject}`, {
        method: 'GET',
    })
    .then(response => response.json())
    .then(sortedCard => {
        console.log("Response")
        return sortedCard;
    });
}


function startStudy(sortedCards) {
    console.log(sortedCards)
    const csrftoken = $('[name=csrfmiddlewaretoken]').val();

    const $cardModal = $('#card__modal');
    
    if (!sortedCards.length) {
        return;
    }

    var i = 0;
    
    // Setup the card modal for study view
    studyCardView();

    // Show the display
    $('#display', $cardModal).html(sortedCards.length + 'left');

    // Show the first card
    $('.flip-card-front-input', $cardModal).html(sortedCards[i]['front']);
    $('.flip-card-back-input', $cardModal).html(sortedCards[i]['back']);

    // Clear modal data whenever changing modal attributes
    $cardModal.modal('dispose');
    // Disable dismissing modal when clicking outside the modal
    $cardModal.modal({backdrop: 'static', keyboard: false})
    .modal('show');

    var playedCards = 0;
    var correctCards = 0;

    const $correctButton = $('#correct button', $cardModal);
    const $falseButton = $('#false button', $cardModal);
    const $display = $('#display', $cardModal);

    // Set cooldown for answering
    var cooldown = false;

    // User answers correctly
    $('#correct').unbind().on('click', function() {

        if (cooldown) {
            return;
        }
        cooldown = true;
        setTimeout(function() { cooldown = false; }, 3000);
        $('#correct .cooldown-div', $cardModal).addClass('cooldown').on('animationend', function() {
            $(this).removeClass('cooldown');
        });

        // Animate button and display
        pulseElement($correctButton);
        pulseElement($display);

        // Increase counters if not seen this card before
        if (!('played' in sortedCards[i])) {
            // No need to mark this card as played since it will be removed
            playedCards += 1;
            correctCards += 1;
            
            updateStats(sortedCards[i], 'CORRECT', csrftoken);
        }

        if (sortedCards.length <= 1) {
            endStudy($cardModal, playedCards, correctCards);
            updateWinrate(sortedCards[i]['group'], sortedCards[i]['subject'])
        }
        else {
            showNextCard($cardModal, sortedCards, i);
        }
    });

    // User answers falsely
    $('#false').unbind().on('click', function() {
        
        if (cooldown) {
            return;
        }
        cooldown = true;
        setTimeout(function() { cooldown = false; }, 3000);
        $('#false .cooldown-div', $cardModal).addClass('cooldown').on('animationend', function() {
            $(this).removeClass('cooldown');
        });

        // Animate button
        pulseElement($falseButton);

        // Increase played cards counter and mark as seen if not seen before
        if (!('played' in sortedCards[i])) {
            sortedCards[i]['played'] = true;
            playedCards += 1;

            updateStats(sortedCards[i], 'FALSE', csrftoken);
        }

        // User answers last card falsely
        if (sortedCards.length <= 1) {
            // Update display, this time with animation
            $display.html(0 + 'left');
            pulseElement($display);

            // Hide correct / false button
            $('#correct', $cardModal).hide();
            $('#false', $cardModal).hide();
        }
        else {
            defaultRotation();
            
           // Show next card
            $('.flip-card-front-input', $cardModal).html(sortedCards[i + 1]['front']);
            // Set timeout so the user won't see the next answer before the card fully rotated
            // We need to take  i since the array will be spliced by then
            setTimeout(function() {
                $('.flip-card-back-input', $cardModal).html(sortedCards[i]['back']);
            }, 500);

            // Append card to end of the array
            sortedCards.push(sortedCards.splice(i, 1)[0]);
        }
    });

    // Dismiss modal when clicking 'End Study' button
    $('#end').unbind().on('click', function() {
        endStudy($cardModal, playedCards, correctCards);
        updateWinrate(sortedCards[i]['group'], sortedCards[i]['subject']);
    });

    // Remove possibly active animation classes
    $display.removeClass('pulse-display');
    $correctButton.removeClass('pulse');
    $falseButton.removeClass('pulse');
    $('#correct .cooldown-div', $cardModal).removeClass('cooldown');
    $('#false .cooldown-div', $cardModal).removeClass('cooldown');
}


function showNextCard($cardModal, sortedCards, i) {

    defaultRotation();

    // Show next card
    $('.flip-card-front-input', $cardModal).html(sortedCards[i + 1]['front']);
    setTimeout(function() {
        $('.flip-card-back-input', $cardModal).html(sortedCards[i]['back']);
    }, 500);

    // Remove card from array
    sortedCards.splice(i, 1);

    // Update display
    $('#display', $cardModal).html(sortedCards.length + 'left');   
}


function studyCardView() {

    const $cardModal = $('#card__modal');

    // Show correct / false and end study button
    $('#correct', $cardModal).show();
    $('#false', $cardModal).show();
    $('#end', $cardModal).show();

    // Hide edit / delete button
    $('#card__modal-edit', $cardModal).hide();
    $('#card__modal-delete', $cardModal).hide();

    // Show display
    $('#display', $cardModal).show();
}


function updateStats(card, answer, csrftoken) {

    return fetch(`./study/${card['group']}/${card['subject']}`, {
        method: 'POST',
        headers: {'X-CSRFToken': csrftoken},
        body: JSON.stringify({
            id: card['id'],
            answer: answer,
        }), csrftoken,
        mode: 'same-origin',
    });
}


function updateWinrate(group, subject) {

    return fetch(`./winrate/${group}/${subject}`, {
        method: 'GET',
    })
    .then(response => response.text())
    .then(winrate => {
        $('#cards__rate span').html(winrate + '%');
    });
}


export { sortCards, startStudy, updateUserStats, updateWinrate }