// ==UserScript==
// @name         CheckItForMe
// @version      0.32
// @match        https://scrap.tf/raffles
// @match        https://scrap.tf/raffles/ending
// @require      https://code.jquery.com/jquery-2.2.4.min.js#sha256=BbhdlvQf/xTY9gja0Dq3HiwQF8LaCRTXxZKRutelT44=
// @updateURL    https://raw.githubusercontent.com/GuilloOme/CheckThisForMe/master/checkItForMe.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    var RELOAD_DELAY = 30,
        ERROR_RELOAD_DELAY = 300,
        ENTERING_DELAY = 2;

    var todoRaffleList = [],
        badRaffleList = [],
        raffleIndex = 0,
        interval = randomInterval(RELOAD_DELAY),
        haveStorageSupport = false;

    $(document).ready(function() {
        console.info('Bot: Started');
        if (Notification.permission !== "granted") {
            Notification.requestPermission();
        }

        if (typeof(Storage) !== "undefined") {
            haveStorageSupport = true;

            if (localStorage.badRaffleList.length > 1000) {
                console.warning('Bot: Purging bad raffle cache!');
                localStorage.badRaffleList = [];
            } else {
                badRaffleList = localStorage.badRaffleList;
            }
        }

        if (parseInt($('.user-notices-count').html()) > 0) {
            console.info('Bot: There is new message(s)!');
            showIcon('Ok');
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
                var url = $(item).find('div.raffle-name > a').attr('href');

                if ($(item).css('opacity') === '1' && badRaffleList.indexOf(url) < 0) {
                    todoRaffleList.push(url);
                }
            });

            if (todoRaffleList.length > 0) {
                //console.info('Bot: Start entering raffles.');

                $.when(enterRaffles()).then(function() {
                    //console.info('Bot: Done entering raffles, reloading…');
                    // update localStorage
                    if (haveStorageSupport) {
                        localStorage.badRaffleList = badRaffleList;
                    }
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
            };

            $.get(url, function(responseData) {

                var request,
                    raffleDeferred = jQuery.Deferred(),
                    raffleKey = $(responseData).find("#raffle-key").val(),
                    enterButton = $(responseData).find('button#raffle-enter'),
                    raffleSpecs = getRaffleSpecs(responseData);

                if (isRaffleWorthIt(raffleSpecs)) {

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
                        }, function(data) {
                            console.warn('Bot: Error when entering raffle: ' + raffleKey + ' ' + (raffleIndex + 1) + '/' + todoRaffleList.length, data);

                            if (data.captcha) {
                                showIcon('Warning');
                                showNotification('Bot: Error when entering raffle:\nCaptcha requested!', 'https://scrap.tf/raffles/' + id);
                                console.warn('Bot: Captcha requested! Reloading in ' + ERROR_RELOAD_DELAY / 60 + 'minutes…');

                                todoRaffleList.forEach(function(url) {
                                    window.open(url);
                                });

                                setTimeout(function() {
                                    location.reload();
                                }, ERROR_RELOAD_DELAY * 1000);

                                raffleDeferred.reject();
                            } else {
                                raffleDeferred.resolve();
                            }
                        });

                    } else {
                        console.info('Bot: Can\'t enter raffle: ' + (raffleIndex + 1) + '/' + todoRaffleList.length);
                        raffleDeferred.resolve();
                    }
                } else {
                    badRaffleList.push(url);
                    console.info('Bot: it\'s not worth it: ' + (raffleIndex + 1) + '/' + todoRaffleList.length);
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

    function showIcon(iconType) {
        var iconLink = '';

        if (iconType === 'Ok') {
            iconLink = '<link href="data:image/x-icon;base64,AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAQAABILAAASCwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAG0QYXBtEGTQbRBk8G0QZPBtEGTwbRBk8G0QZPBtEGTwbRBkkG0QYKAAAAAAAAAAAAAAAAAAAAAAAAAAAG0QYQBtEG5wbRBv8G0Qb/BtEG/wbRBv8G0Qb/BtEG/wbRBv8G0Qb/BtEGwAXRBQAAAAAAAAAAAAAAAAAAAAAABtEGOQbRBv/J9cn/z/bP/6bvpv9/53//nO2c/53tnf/u/O7/l+yX/wbRBvkF0QUHAAAAAAAAAAAAAAAAAAAAAAbRBjoG0Qb/2/jb/yjXKP8G0Qb/EdMR/0zeTP9C3EL/6vvq/6TupP8G0Qb5BdEFCAAAAAAAAAAAAAAAAAAAAAAG0QY6BtEG/9v42/8l1yX/BtEG/xHTEf9M3kz/Nto2/7Xxtf+k7qT/BtEG+QXRBQgAAAAAAAAAAAAAAAAAAAAABtEGOgbRBv/b+Nv/jeqN/xjUGP8S0xL/TN5M/zfaN//F9MX/pO6k/wbRBvkF0QUIAAAAAAAAAAAAAAAAAAAAAAbRBjoG0Qb/2/jb//////+B6IH/FNQU/8X0xf+9873/9v32/6TupP8G0Qb5BdEFCAAAAAAAAAAAAAAAAAAAAAAG0QY6BtEG/9v42///////6vvq/w/TD//z/fP///////////+k7qT/BtEG+QXRBQgAAAAAAAAAAAAAAAAAAAAABtEGOQbRBv/T99P/+f75//n++f+b7Zv/9f31//n++f/5/vn/nu2e/wbRBvkF0QUIAAAAAAAAAAAAAAAAAAAAAAbRBhMG0QbtB9EH/wjRCP8I0Qj/CNEI/wjRCP8I0Qj/CNEI/wfRB/8G0QbHBdEFAQAAAAAAAAAAAAAAAAAAAAAAAAAABtEGHwbRBlsG0QZdBtEGXQbRBl0G0QZdBtEGXQbRBl0G0QZWBtEGDwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//8AAP//AAD//wAA4AcAAMADAADAAwAAwAMAAMADAADAAwAAwAMAAMADAADAAwAAwAMAAOAHAAD//wAA//8AAA==" rel="icon" type="image/x-icon">';
        } else if (iconType === 'Warning') {
            iconLink = '<link href="data:image/x-icon;base64,AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAQAABILAAASCwAAAAAAAAAAAAAAAAADAAAABgAAAAYAAAAGAAAABgAAAAYAAAAGAAAABgAAAAYAAAAGAAAABgAAAAYAAAAGAAAABwAAAAcAAAADAAAAmwAHCcIACQvCAAkLwgAJC8IACQvCAAkLwgAJDMIACQzCAAkMwgAJDMIACQzCAAkMwgAJDMIACArDAAAAmwAAAGsAbIf4AMz//wDM//8AzP//AMz//wDM//8Auun/AK/b/wDM//8AzP//AMz//wDM//8AzP//AGyH+QAAAGsAAAAZAA0QtgC24/8AzP//AMz//wDM//8AzP//Ai86/wMLDf8AwvP/AMz//wDM//8AzP//ALfk/wAOEbgAAAAZAAAAAAAAAFAAT2LqAMz//wDM//8AzP//AMz//wF/n/8CYXn/AMv+/wDM//8AzP//AMz//wBRZesAAABSAAAAAAAAAAAAAAAIAAIDngCcw/8AzP//AMz//wDM//8AeZj/AHSR/wDM//8AzP//AMz//wCfx/8AAwShAAAACQAAAAAAAAAAAAAAAAAAADgAMDzYAMr8/wDM//8AzP//ACQt/wAbIv8AzP//AMz//wDL/f8ANEHbAAAAOwAAAAAAAAAAAAAAAAAAAAAAAAABAAAAfQB9nP4AzP//AMz//wAcI/8AFBj/AMz//wDM//8AgqP+AAAAggAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACMAGB7DAL/v/wDM//8AFBn/AA0Q/wDL/v8AwvL/ABwjyAAAACcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAXwBgePMAy/7/AA0Q/wAHCf8Ayfv/AGaA9gAAAGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABEABwisAKvV/wAPE/8ACgz/AK7Z/wAKDLIAAAAVAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARgBCUuIAn8f/AJzD/wBLXecAAABNAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAGRAI+y/wCZv/8AAQKbAAAABgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALwAlLtAALTnWAAAANgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABvAAAAeQAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIABAACAAQAAwAMAAMADAADgBwAA8A8AAPAPAAD4HwAA+B8AAPw/AAD8PwAA/n8AAA==" rel="icon" type="image/x-icon">';
        }

        $('link[rel*="icon"]').remove();
        $('head').append(iconLink);

    }

    function showNotification(msg, link) {
        if (Notification.permission === "granted") {
            var notification = new Notification('Notification', {
                icon: 'data:image/x-icon;base64,AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAQAABILAAASCwAAAAAAAAAAAAAAAAADAAAABgAAAAYAAAAGAAAABgAAAAYAAAAGAAAABgAAAAYAAAAGAAAABgAAAAYAAAAGAAAABwAAAAcAAAADAAAAmwAHCcIACQvCAAkLwgAJC8IACQvCAAkLwgAJDMIACQzCAAkMwgAJDMIACQzCAAkMwgAJDMIACArDAAAAmwAAAGsAbIf4AMz//wDM//8AzP//AMz//wDM//8Auun/AK/b/wDM//8AzP//AMz//wDM//8AzP//AGyH+QAAAGsAAAAZAA0QtgC24/8AzP//AMz//wDM//8AzP//Ai86/wMLDf8AwvP/AMz//wDM//8AzP//ALfk/wAOEbgAAAAZAAAAAAAAAFAAT2LqAMz//wDM//8AzP//AMz//wF/n/8CYXn/AMv+/wDM//8AzP//AMz//wBRZesAAABSAAAAAAAAAAAAAAAIAAIDngCcw/8AzP//AMz//wDM//8AeZj/AHSR/wDM//8AzP//AMz//wCfx/8AAwShAAAACQAAAAAAAAAAAAAAAAAAADgAMDzYAMr8/wDM//8AzP//ACQt/wAbIv8AzP//AMz//wDL/f8ANEHbAAAAOwAAAAAAAAAAAAAAAAAAAAAAAAABAAAAfQB9nP4AzP//AMz//wAcI/8AFBj/AMz//wDM//8AgqP+AAAAggAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACMAGB7DAL/v/wDM//8AFBn/AA0Q/wDL/v8AwvL/ABwjyAAAACcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAXwBgePMAy/7/AA0Q/wAHCf8Ayfv/AGaA9gAAAGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABEABwisAKvV/wAPE/8ACgz/AK7Z/wAKDLIAAAAVAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARgBCUuIAn8f/AJzD/wBLXecAAABNAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAGRAI+y/wCZv/8AAQKbAAAABgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALwAlLtAALTnWAAAANgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABvAAAAeQAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIABAACAAQAAwAMAAMADAADgBwAA8A8AAPAPAAD4HwAA+B8AAPw/AAD8PwAA/n8AAA==',
                body: msg,
            });
            notification.onclick = function() {
                window.open(link);
                notification.close();
            };
        }
    }

    function getRaffleSpecs(responseData) {
        var itemsData = $(responseData).find('.raffle-items>div'),
            raffle = {
                timeLeft: Math.floor((parseInt($(responseData).find('dd.raffle-time-left').attr('data-time')) - (new Date().getTime() / 1000))),
                winChance: parseInt($(responseData).find('#raffle-win-chance').html()),
                totalEntries: parseInt($(responseData).find('span#raffle-num-entries').attr('data-max')),
                haveSpecials: false, //metal or hats or featured items
                count: 0
            };

        for (var i = 0 ; i <= itemsData.length ; i++) {

            var data = $(itemsData[i]);

            //it's a tf2 item
            if (data.attr('data-appid') === '440') {
                var isHat = function() {
                        // any cosmetic or taunt
                        return data.attr('data-slot') === 'misc' || data.attr('data-slot') === 'taunt';
                    },
                    isMetal = function() {
                        // any metal or key
                        return data.attr('data-slot') === 'all' && (data.attr('data-title').match('Metal') || data.attr('data-title').match('Key'));
                    },
                    haveFeature = function() {
                        var classes = data.attr('class');
                        // killstreak or rare or genuine or strange or unusuals or token
                        return classes.match('killstreak') || classes.match('rarity') || classes.match('quality3') || classes.match('quality11') || classes.match('quality5') || classes.match('token');
                    },
                    isSpecials = isMetal() || isHat() || haveFeature();

                if (isSpecials) {
                    raffle.haveSpecials = true;
                }

                raffle.count++;
            }

        }

        return raffle;
    }

    function isRaffleWorthIt(raffle) {
        var isIt = false;

        if (raffle.count > 0) {
            if (raffle.haveSpecials) {
                isIt = true;
            } else if (raffle.totalEntries <= 500) {
                isIt = true;
            } else if (raffle.count >= 10) {
                isIt = true;
            } else if (raffle.timeLeft < 7200) {
                isIt = true;
            }
        }

        return isIt;
    }

})();
