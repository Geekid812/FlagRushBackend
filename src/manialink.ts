
export function DisplayMatchInfo(info: string) {
    return `
    <manialink version="3" name="FlagRushBackend_MatchInfo">
    <label id="matchinfo" pos="0 -76" z-index="0" size="240 20" text="${info.replace("\"", "\\\"")}" halign="center" valign="center2" style="TextInfoSmall" textsize="3.5" maxline="4" textemboss="1" hidden="1"/>
    <script><!--
    declare CMlLabel MatchInfo = (Page.GetFirstChild("matchinfo") as CMlLabel);

    while (True) {
        yield;
        declare netread Boolean Net_FlagRush_MVPShow for Teams[0];
        MatchInfo.Visible = Net_FlagRush_MVPShow;
    }
    --></script>
    </manialink>
    `;
}