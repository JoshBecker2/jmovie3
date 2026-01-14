<small>It is highly important that you read this in its entirety
in order to understand how the app works and behaves.</small>

<p>If the app freezes use [Control + R] to refresh.</p>

<br>

<h3>User Configuration</h3>
<small>Do not rename or relocate the "config.json" file<br>
Please use the in-app settings menu to customize.
<br>Files are located in your computer's "User Data" section.
The "lists" folder contains files that JMovie uses that are able to be modified
</small>

<br>

<h3>Filter Levels</h3>

<u>Note:</u>External links will never open regardless of filter setting. JMovie
protects against pop-ups or navigation to a different site always by default.
Some players require you to click around a bunch before the video loads since the
player keeps trying to open ads. 
<br><br>

<h3><u>Off</u></h3>
This completely disables the web filtering that is typically applied. Turn the filter 
off when players do not work. Clicking on ads will do nothing but progress you 
through the player, should you need to. It will not open a pop-up or redirect you to 
a different site. It is often better to switch to another player if this is a 
persistent issue. If the problem is with the web filter, try disabling some of the 
lists that are used by un-checking them in Settings.
<br>

<h3><u>On (Recommended)</u></h3>
Uses all block lists that are selected by the user in Settings. I have provided
some that worked pretty well from my testing, but feel free to add your own
with resources found at:<br>
<br>
https://github.com/blocklistproject/Lists
<br><br>
In addition, please use the python script "createBlockList.py" to take these lists 
and turn it into something JMovie can use. 
<br><br>
<h3>Customizing Filter Lists</h3>

<small>Do not rename any lists that you see here</small>
<br>
<h3>"whitelist.txt"</h3>

Here are permitted URLs that should be processed on your 
device. Use this for allowing URLs that, if blocked, break 
the player. These follow the same rules that the blacklist does
(add a domain or TLD) and it will be allowed should it appear 
in the URL of the request.

<h3>"cachelist.txt"</h3>

(Clears when the filter is turned off) 
Since the entire blacklist is rather large (especially depending on
how many lists you select) we search this list first 
for previously blocked URLs from the blacklist. This should not be modified
as it is maintained by the app.
<br><br>

<h3>Custom Block Lists</h3>
JMovie blocks URLs based on whether each line in a list is found in the
incoming URL. This means that if ".co" is in the blacklist, any URL ending in 
that will be blocked. Similarly, any url like "vidsrc" with its many TLDs (.to, .me) 
can be blocked entirely by simply including "vidsrc". Use the "createBlockList.py"
file to create a list from sources that you find online so that it is compatible
with my implementation of a filter. This is also how the whitelist filter
is implemented with the same inclusion principle.

<h3>Player Lists</h3>

<small>Do not rename any of these lists or folders</small>
<br>
<h3>"embeds/movies.txt" & "embeds/shows.txt"</h3>
<br>
This is a list of sources that the player can get its 
movies/tv shows from. The search feature uses TMDB, so 
adding custom URLs to your player requires that they have
an endpoint which accepts TMDB IDs. Ensure that you use the <> notation.
Also, each entry has both a name (whatever you want) and a URL
that is separated by a comma (see current output for examples).
<br>
https://www.reddit.com/r/Piracy/comments/1cgxk9s/<br>how_easy_to_create_a_video_streaming_site_like/
<br>
In addition, you can use the player at the bottom to safely 
find new sources using the Dev Tools and JMovie's adblock.

<h3>Keyboard Shortcuts</h3>
If the shortcuts are not working, make sure you are not selecting 
the player as that is a different website that cannot listen to
the keyboard events happening on the application. 
<br>
Shortcuts are case-sensitive so use Shift + W for capital W (like 
a control key command) or lowercase w for a single-button hotkey

<br><br>
Thank you for the continued support throughout the years, I hope
that this final edition of JMovie will be of use to you and anyone
you share it with. I encourage you to make this tool your own, play around,
and improve it. <br><br>Sincerely, Josh B.