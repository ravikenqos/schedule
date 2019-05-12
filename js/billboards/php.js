var php = {
    nl2br: function(str, is_xhtml) {
        var breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ? '<br />' : '<br>';
        return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + breakTag + '$2');
    },
    get_html_translation_table: function(table, quote_style) {
        var entities = {},
                hash_map = {},
                decimal;
        var constMappingTable = {},
                constMappingQuoteStyle = {};
        var useTable = {},
                useQuoteStyle = {};

        // Translate arguments
        constMappingTable[0] = 'HTML_SPECIALCHARS';
        constMappingTable[1] = 'HTML_ENTITIES';
        constMappingQuoteStyle[0] = 'ENT_NOQUOTES';
        constMappingQuoteStyle[2] = 'ENT_COMPAT';
        constMappingQuoteStyle[3] = 'ENT_QUOTES';

        useTable = !isNaN(table) ? constMappingTable[table] : table ? table.toUpperCase() : 'HTML_SPECIALCHARS';
        useQuoteStyle = !isNaN(quote_style) ? constMappingQuoteStyle[quote_style] : quote_style ? quote_style.toUpperCase() :
                'ENT_COMPAT';

        if (useTable !== 'HTML_SPECIALCHARS' && useTable !== 'HTML_ENTITIES') {
            throw new Error('Table: ' + useTable + ' not supported');
            // return false;
        }

        entities['38'] = '&amp;';
        if (useTable === 'HTML_ENTITIES') {
            entities['160'] = '&nbsp;';
            entities['161'] = '&iexcl;';
            entities['162'] = '&cent;';
            entities['163'] = '&pound;';
            entities['164'] = '&curren;';
            entities['165'] = '&yen;';
            entities['166'] = '&brvbar;';
            entities['167'] = '&sect;';
            entities['168'] = '&uml;';
            entities['169'] = '&copy;';
            entities['170'] = '&ordf;';
            entities['171'] = '&laquo;';
            entities['172'] = '&not;';
            entities['173'] = '&shy;';
            entities['174'] = '&reg;';
            entities['175'] = '&macr;';
            entities['176'] = '&deg;';
            entities['177'] = '&plusmn;';
            entities['178'] = '&sup2;';
            entities['179'] = '&sup3;';
            entities['180'] = '&acute;';
            entities['181'] = '&micro;';
            entities['182'] = '&para;';
            entities['183'] = '&middot;';
            entities['184'] = '&cedil;';
            entities['185'] = '&sup1;';
            entities['186'] = '&ordm;';
            entities['187'] = '&raquo;';
            entities['188'] = '&frac14;';
            entities['189'] = '&frac12;';
            entities['190'] = '&frac34;';
            entities['191'] = '&iquest;';
            entities['192'] = '&Agrave;';
            entities['193'] = '&Aacute;';
            entities['194'] = '&Acirc;';
            entities['195'] = '&Atilde;';
            entities['196'] = '&Auml;';
            entities['197'] = '&Aring;';
            entities['198'] = '&AElig;';
            entities['199'] = '&Ccedil;';
            entities['200'] = '&Egrave;';
            entities['201'] = '&Eacute;';
            entities['202'] = '&Ecirc;';
            entities['203'] = '&Euml;';
            entities['204'] = '&Igrave;';
            entities['205'] = '&Iacute;';
            entities['206'] = '&Icirc;';
            entities['207'] = '&Iuml;';
            entities['208'] = '&ETH;';
            entities['209'] = '&Ntilde;';
            entities['210'] = '&Ograve;';
            entities['211'] = '&Oacute;';
            entities['212'] = '&Ocirc;';
            entities['213'] = '&Otilde;';
            entities['214'] = '&Ouml;';
            entities['215'] = '&times;';
            entities['216'] = '&Oslash;';
            entities['217'] = '&Ugrave;';
            entities['218'] = '&Uacute;';
            entities['219'] = '&Ucirc;';
            entities['220'] = '&Uuml;';
            entities['221'] = '&Yacute;';
            entities['222'] = '&THORN;';
            entities['223'] = '&szlig;';
            entities['224'] = '&agrave;';
            entities['225'] = '&aacute;';
            entities['226'] = '&acirc;';
            entities['227'] = '&atilde;';
            entities['228'] = '&auml;';
            entities['229'] = '&aring;';
            entities['230'] = '&aelig;';
            entities['231'] = '&ccedil;';
            entities['232'] = '&egrave;';
            entities['233'] = '&eacute;';
            entities['234'] = '&ecirc;';
            entities['235'] = '&euml;';
            entities['236'] = '&igrave;';
            entities['237'] = '&iacute;';
            entities['238'] = '&icirc;';
            entities['239'] = '&iuml;';
            entities['240'] = '&eth;';
            entities['241'] = '&ntilde;';
            entities['242'] = '&ograve;';
            entities['243'] = '&oacute;';
            entities['244'] = '&ocirc;';
            entities['245'] = '&otilde;';
            entities['246'] = '&ouml;';
            entities['247'] = '&divide;';
            entities['248'] = '&oslash;';
            entities['249'] = '&ugrave;';
            entities['250'] = '&uacute;';
            entities['251'] = '&ucirc;';
            entities['252'] = '&uuml;';
            entities['253'] = '&yacute;';
            entities['254'] = '&thorn;';
            entities['255'] = '&yuml;';
        }

        if (useQuoteStyle !== 'ENT_NOQUOTES') {
            entities['34'] = '&quot;';
        }
        if (useQuoteStyle === 'ENT_QUOTES') {
            entities['39'] = '&#39;';
        }
        entities['60'] = '&lt;';
        entities['62'] = '&gt;';

        // ascii decimals to real symbols
        for (decimal in entities) {
            if (entities.hasOwnProperty(decimal)) {
                hash_map[String.fromCharCode(decimal)] = entities[decimal];
            }
        }

        return hash_map;
    },
    addslashes: function(str) {
        return (str + '')
                .replace(/[\\"']/g, '\\$&')
                .replace(/\u0000/g, '\\0');
    },
    stripslashes: function(str) {
        return (str + '')
                .replace(/\\(.?)/g, function(s, n1) {
            switch (n1) {
                case '\\':
                    return '\\';
                case '0':
                    return '\u0000';
                case '':
                    return '';
                default:
                    return n1;
            }
        });
    },
    htmlentities: function(string, quote_style, charset, double_encode) {

        var hash_map = php.get_html_translation_table('HTML_ENTITIES', quote_style),
                symbol = '';
        string = string == null ? '' : string + '';

        if (!hash_map) {
            return false;
        }

        if (quote_style && quote_style === 'ENT_QUOTES') {
            hash_map["'"] = '&#039;';
        }

        if (!!double_encode || double_encode == null) {
            for (symbol in hash_map) {
                if (hash_map.hasOwnProperty(symbol)) {
                    string = string.split(symbol)
                            .join(hash_map[symbol]);
                }
            }
        } else {
            string = string.replace(/([\s\S]*?)(&(?:#\d+|#x[\da-f]+|[a-zA-Z][\da-z]*);|$)/g, function(ignore, text, entity) {
                for (symbol in hash_map) {
                    if (hash_map.hasOwnProperty(symbol)) {
                        text = text.split(symbol)
                                .join(hash_map[symbol]);
                    }
                }

                return text + entity;
            });
        }

        return string;
    },
    html_entity_decode: function(string, quote_style) {
        var hash_map = {},
                symbol = '',
                tmp_str = '',
                entity = '';
        tmp_str = string.toString();

        if (false === (hash_map = php.get_html_translation_table('HTML_ENTITIES', quote_style))) {
            return false;
        }

        delete(hash_map['&']);
        hash_map['&'] = '&amp;';

        for (symbol in hash_map) {
            entity = hash_map[symbol];
            tmp_str = tmp_str.split(entity)
                    .join(symbol);
        }
        tmp_str = tmp_str.split('&#039;')
                .join("'");

        return tmp_str;
    },
    strtotime: function(text, now) {
        //  discuss at: http://phpjs.org/functions/strtotime/
        //     version: 1109.2016
        // original by: Caio Ariede (http://caioariede.com)
        // improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // improved by: Caio Ariede (http://caioariede.com)
        // improved by: A. Matías Quezada (http://amatiasq.com)
        // improved by: preuter
        // improved by: Brett Zamir (http://brett-zamir.me)
        // improved by: Mirko Faber
        //    input by: David
        // bugfixed by: Wagner B. Soares
        // bugfixed by: Artur Tchernychev
        //        note: Examples all have a fixed timestamp to prevent tests to fail because of variable time(zones)
        //   example 1: strtotime('+1 day', 1129633200);
        //   returns 1: 1129719600
        //   example 2: strtotime('+1 week 2 days 4 hours 2 seconds', 1129633200);
        //   returns 2: 1130425202
        //   example 3: strtotime('last month', 1129633200);
        //   returns 3: 1127041200
        //   example 4: strtotime('2009-05-04 08:30:00 GMT');
        //   returns 4: 1241425800

        var parsed, match, today, year, date, days, ranges, len, times, regex, i, fail = false;

        if (!text) {
            return fail;
        }

        // Unecessary spaces
        text = text.replace(/^\s+|\s+$/g, '')
                .replace(/\s{2,}/g, ' ')
                .replace(/[\t\r\n]/g, '')
                .toLowerCase();

        // in contrast to php, js Date.parse function interprets:
        // dates given as yyyy-mm-dd as in timezone: UTC,
        // dates with "." or "-" as MDY instead of DMY
        // dates with two-digit years differently
        // etc...etc...
        // ...therefore we manually parse lots of common date formats
        match = text.match(
                /^(\d{1,4})([\-\.\/\:])(\d{1,2})([\-\.\/\:])(\d{1,4})(?:\s(\d{1,2}):(\d{2})?:?(\d{2})?)?(?:\s([A-Z]+)?)?$/);

        if (match && match[2] === match[4]) {
            if (match[1] > 1901) {
                switch (match[2]) {
                    case '-':
                        { // YYYY-M-D
                            if (match[3] > 12 || match[5] > 31) {
                                return fail;
                            }

                            return new Date(match[1], parseInt(match[3], 10) - 1, match[5],
                                    match[6] || 0, match[7] || 0, match[8] || 0, match[9] || 0) / 1000;
                        }
                    case '.':
                        { // YYYY.M.D is not parsed by strtotime()
                            return fail;
                        }
                    case '/':
                        { // YYYY/M/D
                            if (match[3] > 12 || match[5] > 31) {
                                return fail;
                            }

                            return new Date(match[1], parseInt(match[3], 10) - 1, match[5],
                                    match[6] || 0, match[7] || 0, match[8] || 0, match[9] || 0) / 1000;
                        }
                }
            } else if (match[5] > 1901) {
                switch (match[2]) {
                    case '-':
                        { // D-M-YYYY
                            if (match[3] > 12 || match[1] > 31) {
                                return fail;
                            }

                            return new Date(match[5], parseInt(match[3], 10) - 1, match[1],
                                    match[6] || 0, match[7] || 0, match[8] || 0, match[9] || 0) / 1000;
                        }
                    case '.':
                        { // D.M.YYYY
                            if (match[3] > 12 || match[1] > 31) {
                                return fail;
                            }

                            return new Date(match[5], parseInt(match[3], 10) - 1, match[1],
                                    match[6] || 0, match[7] || 0, match[8] || 0, match[9] || 0) / 1000;
                        }
                    case '/':
                        { // M/D/YYYY
                            if (match[1] > 12 || match[3] > 31) {
                                return fail;
                            }

                            return new Date(match[5], parseInt(match[1], 10) - 1, match[3],
                                    match[6] || 0, match[7] || 0, match[8] || 0, match[9] || 0) / 1000;
                        }
                }
            } else {
                switch (match[2]) {
                    case '-':
                        { // YY-M-D
                            if (match[3] > 12 || match[5] > 31 || (match[1] < 70 && match[1] > 38)) {
                                return fail;
                            }

                            year = match[1] >= 0 && match[1] <= 38 ? +match[1] + 2000 : match[1];
                            return new Date(year, parseInt(match[3], 10) - 1, match[5],
                                    match[6] || 0, match[7] || 0, match[8] || 0, match[9] || 0) / 1000;
                        }
                    case '.':
                        { // D.M.YY or H.MM.SS
                            if (match[5] >= 70) { // D.M.YY
                                if (match[3] > 12 || match[1] > 31) {
                                    return fail;
                                }

                                return new Date(match[5], parseInt(match[3], 10) - 1, match[1],
                                        match[6] || 0, match[7] || 0, match[8] || 0, match[9] || 0) / 1000;
                            }
                            if (match[5] < 60 && !match[6]) { // H.MM.SS
                                if (match[1] > 23 || match[3] > 59) {
                                    return fail;
                                }

                                today = new Date();
                                return new Date(today.getFullYear(), today.getMonth(), today.getDate(),
                                        match[1] || 0, match[3] || 0, match[5] || 0, match[9] || 0) / 1000;
                            }

                            return fail; // invalid format, cannot be parsed
                        }
                    case '/':
                        { // M/D/YY
                            if (match[1] > 12 || match[3] > 31 || (match[5] < 70 && match[5] > 38)) {
                                return fail;
                            }

                            year = match[5] >= 0 && match[5] <= 38 ? +match[5] + 2000 : match[5];
                            return new Date(year, parseInt(match[1], 10) - 1, match[3],
                                    match[6] || 0, match[7] || 0, match[8] || 0, match[9] || 0) / 1000;
                        }
                    case ':':
                        { // HH:MM:SS
                            if (match[1] > 23 || match[3] > 59 || match[5] > 59) {
                                return fail;
                            }

                            today = new Date();
                            return new Date(today.getFullYear(), today.getMonth(), today.getDate(),
                                    match[1] || 0, match[3] || 0, match[5] || 0) / 1000;
                        }
                }
            }
        }

        // other formats and "now" should be parsed by Date.parse()
        if (text === 'now') {
            return now === null || isNaN(now) ? new Date()
                    .getTime() / 1000 | 0 : now | 0;
        }
        if (!isNaN(parsed = Date.parse(text))) {
            return parsed / 1000 | 0;
        }

        date = now ? new Date(now * 1000) : new Date();
        days = {
            'sun': 0,
            'mon': 1,
            'tue': 2,
            'wed': 3,
            'thu': 4,
            'fri': 5,
            'sat': 6
        };
        ranges = {
            'yea': 'FullYear',
            'mon': 'Month',
            'day': 'Date',
            'hou': 'Hours',
            'min': 'Minutes',
            'sec': 'Seconds'
        };

        function lastNext(type, range, modifier) {
            var diff, day = days[range];

            if (typeof day !== 'undefined') {
                diff = day - date.getDay();

                if (diff === 0) {
                    diff = 7 * modifier;
                } else if (diff > 0 && type === 'last') {
                    diff -= 7;
                } else if (diff < 0 && type === 'next') {
                    diff += 7;
                }

                date.setDate(date.getDate() + diff);
            }
        }

        function process(val) {
            var splt = val.split(' '), // Todo: Reconcile this with regex using \s, taking into account browser issues with split and regexes
                    type = splt[0],
                    range = splt[1].substring(0, 3),
                    typeIsNumber = /\d+/.test(type),
                    ago = splt[2] === 'ago',
                    num = (type === 'last' ? -1 : 1) * (ago ? -1 : 1);

            if (typeIsNumber) {
                num *= parseInt(type, 10);
            }

            if (ranges.hasOwnProperty(range) && !splt[1].match(/^mon(day|\.)?$/i)) {
                return date['set' + ranges[range]](date['get' + ranges[range]]() + num);
            }

            if (range === 'wee') {
                return date.setDate(date.getDate() + (num * 7));
            }

            if (type === 'next' || type === 'last') {
                lastNext(type, range, num);
            } else if (!typeIsNumber) {
                return false;
            }

            return true;
        }

        times = '(years?|months?|weeks?|days?|hours?|minutes?|min|seconds?|sec' +
                '|sunday|sun\\.?|monday|mon\\.?|tuesday|tue\\.?|wednesday|wed\\.?' +
                '|thursday|thu\\.?|friday|fri\\.?|saturday|sat\\.?)';
        regex = '([+-]?\\d+\\s' + times + '|' + '(last|next)\\s' + times + ')(\\sago)?';

        match = text.match(new RegExp(regex, 'gi'));
        if (!match) {
            return fail;
        }

        for (i = 0, len = match.length; i < len; i++) {
            if (!process(match[i])) {
                return fail;
            }
        }

        // ECMAScript 5 only
        // if (!match.every(process))
        //    return false;

        return (date.getTime() / 1000);
    }
};