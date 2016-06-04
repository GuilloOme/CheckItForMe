// ==UserScript==
// @name         CheckItForMe
// @namespace    http://tampermonkey.net/
// @version      0.1
// @require      https://code.jquery.com/jquery-2.2.4.min.js#sha256=BbhdlvQf/xTY9gja0Dq3HiwQF8LaCRTXxZKRutelT44=
// @match        SOME-URL
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    var RELOAD_DELAY = 30,
        ENTERING_DELAY = 3;

    var todoRaffleList = [],
        raffleIndex = 0;

    $(document).ready(function() {
        scanHash();
    });

    function scanHash() {
        var hash = window.location.hash,
            url = window.location.href,
            baseUrl = /SOME-URL[\/]*/;

        if (url.match(baseUrl)) {

            scanRaffles();

            setTimeout(function() {
                location.reload();
            }, randomInterval(RELOAD_DELAY));
        }

    }

    function scanRaffles() {
        $.when(scrollToBottom()).then(function() {
            $('div.panel-raffle').each(function(id, item) {
                if($(item).css('opacity') === '1'){
                    todoRaffleList.push($(item).find('div.raffle-name > a').attr('href'));
                }
            });
            if(todoRaffleList.length >0){
                enterRaffles(todoRaffleList);
            }
        });
    }

    function enterRaffles(raffleList){
        console.log('entering raffles:',raffleList.length);

        function joinRaffle(url){
            var currentChildWindow = window.open(url);

            $(currentChildWindow.document).ready(function(){
                var waitInterval;
                console.log('entrering raffle: '+(raffleIndex+1)+'/'+raffleList.length);

                waitInterval= setInterval(function() {
                    console.log('waiting confirmation…');

                    if($(currentChildWindow.document).find('button#raffle-enter>i18n').html() === 'Leave Raffle' || $(currentChildWindow.document).find('div.alert-error').length > 0){

                        console.log('closing window');

                        currentChildWindow.close();

                        raffleIndex++;
                        if(raffleIndex < todoRaffleList.length){
                            setTimeout(function() {
                                joinRaffle(todoRaffleList[raffleIndex]);
                            }, randomInterval(ENTERING_DELAY));
                        }

                        clearInterval(waitInterval);

                    } else if($(currentChildWindow.document).find('button#raffle-enter>i18n').html() === 'Enter Raffle'){

                        $(currentChildWindow.document).find('button#raffle-enter').trigger( 'click' );

                    }
                }, randomInterval(ENTERING_DELAY));



            });


        }

        joinRaffle(todoRaffleList[raffleIndex]);
    }



    function scrollToBottom() {
        var deferred = jQuery.Deferred(),
            keepScrolling = true;

        var scrollInterval = setInterval(function() {

            if (keepScrolling) {
                $('html, body').animate({scrollTop: $(document).height()}, 500);
            } else {
                deferred.resolve();
                clearInterval(scrollInterval);
            }

            keepScrolling = !($('.pag-loading').text() === 'That\'s all, no more!');

        }, randomInterval());

        return deferred.promise();

    }
    function randomInterval(delay){
        if(!delay){
            delay = 1;
        }
        return (delay*1000)+Math.floor(Math.random()*(delay*1000));
    }

})();
