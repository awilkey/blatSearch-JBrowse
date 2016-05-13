define( [
            'dojo/_base/declare',
            'JBrowse/View/InfoDialog'
        ],
        function(
            declare,
            InfoDialog
        ) {
return declare( InfoDialog, {

    title: "Sequence search Help",

    constructor: function(args) {
        this.browser = args.browser;
        this.defaultContent = this._makeDefaultContent();

        if( ! args.content && ! args.href ) {
            // make a div containing our help text
            this.content = this.defaultContent;
        }
    },

    _makeDefaultContent: function() {
        return    ''
                + '<div class="help_dialog">'
                + '<div class="main" style="float: left; width: 49%;">'

                + '<dl>'
                + '<dt>About</dt>'
                + '<dd><ul>'
                + '    <li> This tool returns matching regions of sequence alignment on the current genome using Blat.</li>'
                + '</ul></dd>'
                + '<dt>Search Tool</dt>'
                + '<dd><ul>'
                + '    <li> Select the search you wish to use.</li>'
		+ '    <li> Available searches are chosen by the adminstrtor.</li>'
		+ '    <li> Default searches are: </li>'
		+ '    <dt> Blat DNA <dd> Blat search using flags: -q=dna -maxIntron=10000 -nohead </dd></dt>'
		+ '    <dt> Blat RNA <dd> Blat search using flags: -q=rna -maxIntron=10000 -nohead </dd></dt>'
		+ '    </ul>'
                + '</dd>'
                + '<dt>Entering Sequence</dt>'
                + '<dd><ul><li>Enter sequence using standard IUPAC codes: AGCTUSFLY_WLPHQRIMTNKSRVADEG </li>'
                + '        <li>Any additional characters will cause the sequence to be treated as invalid.</li>'
                + '    </ul>'
                + '</dd>'
                + '</dl>'
                + '</div>'

                + '<div class="main" style="float: right; width: 49%;">'
                + '<dl>'
                + '<dt>Options</dt>'
                + '<dd><ul>'
                + '    <dt> Number of hits to return <dd> Maximum number of matches to return.</dd></dt>'
                + '    <dt> Minumum percent identity <dd> Matches that fall below this threshold will not be returned.</dd></dt>'
                + '    <dt> Restrict hits to current refrence sequence<dd>If selected, restricts results only to matches in the refrence sequence the browser is currently looking at, otherwise returns matches across the entier genome</dd></dt>'
                + '    </ul>'
                + '</dd>'
                + '<dt>Results</dt>'
                + '<dd><ul>'
                + '    <li> Results returned are by default sorted by score.</li>'
		+ '    <li> You may resort the matches by clicking on the header of each column</li>'
		+ '    <li> Clicking on a match will redirect the browser to view it, as well as highlight the matching region.</li>'
		+ '    </ul>'
                + '</dd>'
                + '</dl>'
                + '</div>'
                + '</div>'
            ;
    }
});
});
