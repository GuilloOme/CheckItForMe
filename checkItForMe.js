// ==UserScript==
// @name         CheckItForMe
// @version      0.19
// @match        https://scrap.tf/raffles
// @match        https://scrap.tf/raffles/ending
// @require      https://code.jquery.com/jquery-2.2.4.min.js#sha256=BbhdlvQf/xTY9gja0Dq3HiwQF8LaCRTXxZKRutelT44=
// @updateURL    https://raw.githubusercontent.com/GuilloOme/CheckThisForMe/master/checkItForMe.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    var RELOAD_DELAY = 10,
        ENTERING_DELAY = 2.5;

    var todoRaffleList = [],
        raffleIndex = 0,
        interval = randomInterval(RELOAD_DELAY);

    $(document).ready(function() {
        console.info('Bot: Started');
        
        if(parseInt($('.user-notices-count').html()) > 0){
            console.info('Bot: There is new message(s)!');
            $('link[rel*="icon"]').remove();
            $('head').append('<link href="data:image/x-icon;base64,AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAQAABILAAASCwAAAAAAAAAAAAAAAAADAAAABgAAAAYAAAAGAAAABgAAAAYAAAAGAAAABgAAAAYAAAAGAAAABgAAAAYAAAAGAAAABwAAAAcAAAADAAAAmwAHCcIACQvCAAkLwgAJC8IACQvCAAkLwgAJDMIACQzCAAkMwgAJDMIACQzCAAkMwgAJDMIACArDAAAAmwAAAGsAbIf4AMz//wDM//8AzP//AMz//wDM//8Auun/AK/b/wDM//8AzP//AMz//wDM//8AzP//AGyH+QAAAGsAAAAZAA0QtgC24/8AzP//AMz//wDM//8AzP//Ai86/wMLDf8AwvP/AMz//wDM//8AzP//ALfk/wAOEbgAAAAZAAAAAAAAAFAAT2LqAMz//wDM//8AzP//AMz//wF/n/8CYXn/AMv+/wDM//8AzP//AMz//wBRZesAAABSAAAAAAAAAAAAAAAIAAIDngCcw/8AzP//AMz//wDM//8AeZj/AHSR/wDM//8AzP//AMz//wCfx/8AAwShAAAACQAAAAAAAAAAAAAAAAAAADgAMDzYAMr8/wDM//8AzP//ACQt/wAbIv8AzP//AMz//wDL/f8ANEHbAAAAOwAAAAAAAAAAAAAAAAAAAAAAAAABAAAAfQB9nP4AzP//AMz//wAcI/8AFBj/AMz//wDM//8AgqP+AAAAggAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACMAGB7DAL/v/wDM//8AFBn/AA0Q/wDL/v8AwvL/ABwjyAAAACcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAXwBgePMAy/7/AA0Q/wAHCf8Ayfv/AGaA9gAAAGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABEABwisAKvV/wAPE/8ACgz/AK7Z/wAKDLIAAAAVAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARgBCUuIAn8f/AJzD/wBLXecAAABNAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAGRAI+y/wCZv/8AAQKbAAAABgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALwAlLtAALTnWAAAANgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABvAAAAeQAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIABAACAAQAAwAMAAMADAADgBwAA8A8AAPAPAAD4HwAA+B8AAPw/AAD8PwAA/n8AAA==" rel="icon" type="image/x-icon">');
        }

        scanHash();
    });

    function scanHash() {
        var hash = window.location.hash,
            url = window.location.href,
            baseUrl = /https:\/\/scrap.tf\/raffles/;

        if (url.match(baseUrl) && isThereNewRaffles()) {
            scanRaffles();
        } else {
            console.info('Bot: Nothing to do, waiting ' + (interval / 1000) + ' sec before reloading…');

            setTimeout(function() {
                location.reload();
            }, interval);
        }

    }

    function scanRaffles() {
        //console.info('Bot: Loading all the raffles…');

        $.when(loadAllRaffles()).then(function() {
            var activePanel = $('div.panel');
            $(activePanel[activePanel.length - 1]).find('div.panel-raffle').each(function(id, item) {
                if ($(item).css('opacity') === '1') {
                    todoRaffleList.push($(item).find('div.raffle-name > a').attr('href'));
                }
            });

            if (todoRaffleList.length > 0) {
                //console.info('Bot: Start entering raffles.');

                $.when(enterRaffles()).then(function() {
                    //console.info('Bot: Done entering raffles, reloading…');
                    location.reload();
                });
            } else {
                console.info('Bot: No raffle to enter, waiting ' + (interval / 1000) + ' sec before reloading…');
                setTimeout(function() {
                    location.reload();
                }, interval);
            }
        });

    }

    function enterRaffles() {
        var deferred = jQuery.Deferred();

        function joinRaffle(url) {

            var id, hash;

            ScrapTF.Raffles.EnterRaffle = function(idArg, hashArg) {
                id = idArg;
                hash = hashArg;
            }

            $.get(url, function(responseData) {

                var request,
                    raffleDeferred = jQuery.Deferred(),
                    raffleKey = $(responseData).find("#raffle-key").val(),
                    enterButton = $(responseData).find('button#raffle-enter');

                if (enterButton.length > 0 && $(responseData).find('button#raffle-enter>i18n').html() === 'Enter Raffle') {
                    console.info('Bot: Entrering raffle: ' + (raffleIndex + 1) + '/' + todoRaffleList.length);

                    $(responseData).find('button#raffle-enter').click();

                    request = {
                        raffle: id,
                        captcha: '',
                        rafflekey: raffleKey,
                        password: '',
                        hash: hash
                    };

                    ScrapTF.Ajax('viewraffle/EnterRaffle', {
                        raffle: id,
                        captcha: '',
                        rafflekey: raffleKey,
                        password: '',
                        hash: hash
                    }, function() {
                        console.info('Bot: Done entering raffle');

                        raffleDeferred.resolve();
                    }, function() {
                        console.warn('Bot: Error when entering raffle: ' + (raffleIndex + 1) + '/' + todoRaffleList.length);

                        raffleDeferred.resolve();
                    });

                } else {
                    console.warn('Bot: Can\'t enter raffle: ' + (raffleIndex + 1) + '/' + todoRaffleList.length);
                    raffleDeferred.resolve();
                }

                $.when(raffleDeferred.promise()).then(function() {
                    raffleIndex++;
                    if (raffleIndex < todoRaffleList.length) {
                        setTimeout(function() {
                            joinRaffle(todoRaffleList[raffleIndex]);
                        }, randomInterval(ENTERING_DELAY));
                    } else {
                        deferred.resolve();
                    }
                });

            });

            /* var currentChildFrame = window.open(url);

             $(currentChildFrame.document).ready(function() {
             var waitInterval;
             console.log('Bot: Entrering raffle: ' + (raffleIndex + 1) + '/' + todoRaffleList.length);

             waitInterval = setInterval(function() {
             console.log('Bot: Waiting confirmation…');

             if ($(currentChildFrame.document).find('button#raffle-enter>i18n').html() === 'Leave Raffle' || $(currentChildFrame.document).find('div.alert-error').length > 0) {

             console.log('Bot: Closing raffle window');

             currentChildFrame.close();

             raffleIndex++;
             if (raffleIndex < todoRaffleList.length) {
             setTimeout(function() {
             joinRaffle(todoRaffleList[raffleIndex]);
             }, randomInterval(ENTERING_DELAY));
             } else {
             deferred.resolve();
             }

             clearInterval(waitInterval);

             } else if ($(currentChildFrame.document).find('button#raffle-enter>i18n').html() === 'Enter Raffle') {

             $(currentChildFrame.document).find('button#raffle-enter').trigger('click');

             }
             }, randomInterval(ENTERING_DELAY));

             });*/

        }

        joinRaffle(todoRaffleList[raffleIndex]);

        return deferred.promise();
    }

    function isThereNewRaffles() {

        var value = $('div.panel-body>div.text-center>i18n>var').text(),
            ar = value.match(/[0-9]+/gi),
            raffleToEnterNumber = (parseInt(ar[1]) - parseInt(ar[0]));

        console.info('Bot: ' + value + ', There is ' + raffleToEnterNumber + ' raffle(s) to enter.');

        return (ar.length > 1 && raffleToEnterNumber > 0);
    }

    function loadAllRaffles() {
        var deferred = jQuery.Deferred();

        var loadInterval = setInterval(function() {

            if (!ScrapTF.Raffles.Pagination.isDone) {
                ScrapTF.Raffles.Pagination.LoadNext();
            } else {
                deferred.resolve();
                clearInterval(loadInterval);
            }

        }, randomInterval());

        return deferred.promise();

    }

    function randomInterval(delay) {
        if (!delay) {
            delay = 0.5;
        }
        return Math.floor(delay * 1000) + Math.floor(Math.random() * (delay * 1000));
    }

})
();
