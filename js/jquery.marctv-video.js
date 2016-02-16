(function ($) {
    /*
     * MarcTV Video Embed
     *
     * Marc Tönsing 2016
     *
     *
     * Version 3.8
     */

    $.fn.embedvideo = function (options) {
        options = $.extend({
            description_html: '<p class="wp-caption-text"></p>',
            yt_api_key: 'AIzaSyA9jwQmeLXBFSjz1rki8fetQ25hypVn8PM',
            forcehd: false,
            showinfo: false,
            mediatypes: {
                youtube: {
                    label: 'YouTube',
                    linksyntax: 'youtube.com/watch?',
                    thumb_w: 4,
                    thumb_h: 3,
                    iframeurl: 'http://www.youtube.com/embed/',
                    timeregex: new RegExp(/^[^t]+t.(.{6}).*/),
                    urlpostfix: '&amp;showinfo=0&amp;rel=0&amp;border=0&amp;fs=1&amp;iv_load_policy=1',
                    thumb_asy: false
                },
                vimeo: {
                    label: 'VIMEO',
                    linksyntax: 'vimeo.com',
                    thumb_w: 16,
                    thumb_h: 9,
                    iframeurl: 'http://player.vimeo.com/video/',
                    timeregex: new RegExp(/^[^t]+t.(.{5}).*/),
                    urlpostfix: '',
                    thumb_asy: true
                }
            }
        }, options);


        $.fn.buildPlayer = function (mediaID, time, mediatype) {

            var vidobj = '';
            var vidimg = '';
            var offset = '';
            var iframeurl = '';
            var label = '';

            if (time) {
                offset = '&start=' + time;
            }

            var hd = "";
            if (options.forcehd) {
                hd = '&amp;vq=hd720&amp;hd=1';
            }
            var showinfo = "&showinfo=0";
            if (options.showinfo) {
                hd = '&amp;showinfo=1';
            }

            iframeurl = options.mediatypes[mediatype].iframeurl;

            label = options.mediatypes[mediatype].label;

            vidobj = $('<iframe height="720" width="1280" src="' + iframeurl + mediaID + '?autoplay=1&rel=0' + showinfo + offset + hd + '" frameborder="0" scrolling="no" webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe>');

            vidimg = $('<div class="crop"><span class="layer"> </span><span class="playicon_area"></span> <span class="sprite playicon_hover"> </span> <span class="sprite playicon"> </span><span class="videotype">' + label + '</span><div class="img"></div>');

            var title = this.html();

            gaEvent(mediatype, 'loaded', title);

            if (title) {
                $(vidimg).find('.videotype').html(label + ' - ' + title);
            }

            var caption_markup = $(options.description_html).html('<a href="' + this.attr('href') + '">' + title + '</a>');

            this.wrap('<div class="jqvideo wp-caption" />').after(caption_markup).after(vidimg).hide();

            var jqplayer = $(this).parent('.jqvideo');

            switch (mediatype) {
                case "vimeo":

                    $.ajax({
                        url: 'http://vimeo.com/api/v2/video/' + mediaID + '.json',
                        dataType: 'jsonp',
                        success: function (data) {
                            $("a.embedvideo", jqplayer).html(data[0].title);
                            $(".img", vidimg).replaceWith('<img src="' + data[0].thumbnail_large + '">');
                            $(jqplayer).setSize();
                        }
                    });
                    break;
                case "youtube":
                    $(".img", vidimg).replaceWith('<img src="http://img.youtube.com/vi/' + mediaID + '/hqdefault.jpg">');
                    $(jqplayer).setSize();
                    var img = new Image();

                    img.onload = function () {
                        if (this.width > 300) {
                            $("img", vidimg).attr('src', this.src);
                        }
                        $(jqplayer).setSize();
                    };
                    img.src = 'http://i2.ytimg.com/vi/' + mediaID + '/maxresdefault.jpg';

                    break;
                default:
            }

            $(".crop", jqplayer).click(function () {
                var img_width = 0;
                img_width = $("img", this).width();
                if (img_width < 1) {
                    img_width = $(".img", this).width();
                }

                var img_height = aspectHeight(img_width, 16, 9);

                trackVideo(mediaID, mediatype, title);

                $(this).html(vidobj);

                $("iframe", this).css({
                    'width': img_width,
                    'height': img_height
                });

                $("iframe", this).css({
                    "height": this.height - 1
                });

                var title = $("a.embedvideo", jqplayer).html();

            });

            $(".crop", jqplayer).hover(
                function () {
                    $(".layer", this).fadeTo("fast", 0.1);
                },
                function () {
                    $(".layer", this).fadeTo("fast", 0.2);
                }
            );


            $(".playicon_area", jqplayer).hover(
                function () {
                    $(".playicon_hover", jqplayer).fadeOut("fast");
                    $(".layer", jqplayer).fadeTo("fast", 0);
                },
                function () {
                    $(".playicon_hover", jqplayer).fadeIn("fast");
                    $(".layer", jqplayer).fadeTo("fast", 0.1);
                }
            );
        };

        $.fn.setSize = function (ar) {
            this.each(function () {
                var media = parseVideoURL($("a", this).attr('href'));

                var margintop = 0;
                var marginbottom = 0;

                var thumb_w = options.mediatypes[media.provider].thumb_w;
                var thumb_h = options.mediatypes[media.provider].thumb_h;

                // check if HD thumb is loaded.
                if ($("img", this).attr("src").indexOf("maxres") !== -1) {
                    thumb_w = 16;
                    thumb_h = 9;
                }

                var img_width = $(this).width();
                var img_height_wide = aspectHeight(img_width, 16, 9);
                var img_height_input = aspectHeight(img_width, thumb_w, thumb_h);

                // calculated 4:3 height - 16:9 height + 20% (black bar)
                if (options.mediatypes[media.provider].thumb_w === 4) {
                    marginbottom = ((((img_height_input - img_height_wide) / 2)) * -1);
                    marginbottom = marginbottom;
                    margintop = marginbottom;
                }

                var playbt_left = (img_width / 2) - ($(".playicon", this).width() / 2);
                var playbt_top = ((img_height_wide / 2) - ($(".playicon", this).height() / 2)) - 10;


                $(this).children(".crop").children(".playicon,.playicon_hover,.playicon_area").css({
                    'left': playbt_left,
                    'top': playbt_top
                });

                $("img", this).css({
                    'width': img_width,
                    'height': img_height_input,
                    'margin-top': margintop,
                    'margin-bottom': marginbottom,
                    'max-width': img_width
                });

                $(".videotype", this).fadeTo(0, 0.8);

                $(".layer", this).css({
                    'width': img_width,
                    'height': img_height_wide,
                    'background': '#000'
                }).fadeTo("fast", 0.2);

                $("iframe", this).css({
                    'width': img_width,
                    'height': img_height_wide
                });

                $(".img", this).css({
                    'width': img_width,
                    'height': img_height_wide,
                    'background': '#bbb'
                });

            });
        };

        var gaEvent = function (category, action, label) {

            if (window._gaq && _gaq.push) {
                _gaq.push(['_trackEvent', category, action, label]);
            }

            if (window.ga && ga.create) {
                ga('send', 'event', {
                    eventCategory: category,
                    eventAction: action,
                    eventLabel: label
                });
            }
        };

        var trackVideo = function (mediaID, mediatype, title) {

            switch (mediatype) {

                case "vimeo":

                    gaEvent('vimeo', 'play', title);

                    break;

                case "youtube":
                    $.ajax({
                        type: "GET",
                        url: 'https://www.googleapis.com/youtube/v3/videos?id=' + mediaID + '&key=' + options.yt_api_key + '&part=snippet,status,contentDetails',
                        dataType: 'jsonp',
                        cache: true,
                        success: function (data) {

                            if (data.items.length > 0) {
                                var vidtitle = data.items[0].snippet.title;
                                    gaEvent('youtube', 'play', vidtitle);

                            } else {
                                gaEvent('youtube', 'error', title);
                            }
                        }
                    });
                    break;

                default:
                    return false;
            }

        };

        var getQuerystring = function (key, url) {
            key = key.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
            var regex = new RegExp("[\\?&]" + key + "=([^&#]*)");
            var qs = regex.exec(url);
            if (qs === null) {
                return false;
            }
            else {
                return qs[1];
            }
        };

        var getSeconds = function (url) {
            var timestr = getQuerystring('t', url);

            if (timestr) {
                var arr = (timestr.split('m'));
                var min = arr[0];
                var sec = arr[1].split('s')[0];
                var seconds = parseInt(min * 60, 10) + parseInt(sec, 10);

                return seconds;
            } else {
                return false;
            }
        };

        var aspectHeight = function (width, aspect_w, aspect_h) {
            var height = width / aspect_w * aspect_h;
            return height;
        };

        var getOptions = function (myClasses) {
            for (var i = 0; i < myClasses.length; i++) {
                if (myClasses[i] === "forcehd") {
                    options.forcehd = true;
                }
                if (myClasses[i] === "showinfo") {
                    options.showinfo = true;
                }
            }
        };

        function parseVideoURL(url) {

            function getParm(url, base) {
                var re = new RegExp("(\\?|&)" + base + "\\=([^&]*)(&|$)");
                var matches = url.match(re);
                if (matches) {
                    return (matches[2]);
                } else {
                    return ("");
                }
            }

            var retVal = {};
            var matches;

            if (url.indexOf("youtube.com/watch") !== -1) {
                retVal.provider = "youtube";
                retVal.id = getParm(url, "v");
            } else {
                matches = url.match(/vimeo.com\/(\d+)/);
                retVal.provider = "vimeo";
                retVal.id = matches[1];
            }
            return (retVal);
        }


        return this.each(function () {

            getOptions($(this).attr('class').split(' '));
            var link = $(this).attr('href');
            var media = parseVideoURL(link);
            var offset = getSeconds(link);
            if (typeof media.id !== "undefined") {
                $(this).buildPlayer(media.id, offset, media.provider);
            }

        });
    };

    $(document).ready(function ($) {

        // detect svg and add body class
        if (document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#Shape", "1.1")) {
            $("body").addClass("svg");
        }
        $('.embedvideo:in-viewport').embedvideo();

        $(window).scroll(function () {
            $('.embedvideo:in-viewport').embedvideo();
        });

        function resizeStuff() {
            $(".jqvideo").setSize();
        }

        var TO = false;

        $(window).resize(function () {
            if (TO !== false)
                clearTimeout(TO);
            TO = setTimeout(resizeStuff, 200); //200 is time in miliseconds
        });
    });

}(jQuery));
