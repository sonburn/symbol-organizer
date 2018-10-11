![Symbol Organizer](https://raw.githubusercontent.com/sonburn/symbol-organizer/master/logo.png)

Organize your symbols page, and layer list, alphabetically and into groupings determined by your symbol names. Also provides the ability to choose the granularity of the groups, layout symbols horizontally or vertically, set a maximum of symbols per row/column, reverse the layer list sort direction, sequentially rename duplicate symbols, gather symbols from other pages, and remove unused symbols (symbols which are nested in other symbols, or used as overrides, will NOT be removed).

![Symbol Organizer](https://raw.githubusercontent.com/sonburn/symbol-organizer/master/Screenshots/Symbol%20Organizer.png)

<a href="http://bit.ly/SketchRunnerWebsite">
	<img width="160" height="41" src="http://bit.ly/RunnerBadgeBlue" alt="runner-badge-blue">
</a>

<a href="https://sketchpacks.com/sonburn/symbol-organizer/install">
	<img width="160" height="41" src="http://sketchpacks-com.s3.amazonaws.com/assets/badges/sketchpacks-badge-install.png" >
</a>

<a href="https://www.paypal.me/sonburn">
	<img width="160" height="41" src="https://raw.githubusercontent.com/DWilliames/PDF-export-sketch-plugin/master/images/paypal-badge.png">
</a>

# Usage

* cmd option shift o - Configure and run Symbol Organizer
* cmd option control o - Run Symbol Organizer using last settings

# Installation

## Automatic
Search for Symbol Organizer in [Sketchrunner](http://sketchrunner.com/), [Sketchpacks](https://sketchpacks.com/), or [Sketch Toolbox](http://sketchtoolbox.com/) if you have one of those installed.

Once installed, Sketch will automatically notify you when an update is available (version 11.3 and later).

## Manual

1. Download and open symbol-organizer-master.zip
2. Navigate to Symbol Organizer.sketchplugin and copy/move to your plugins directory

To find your plugins directory...

1. In the Sketch menu, navigate to Plugins > Manage Plugins...
2. Click the cog in the lower left of the plugins window, and click Reveal Plugins Folder

# Changelog

* **15.6** - Fix for displaying titles in versions prior to Sketch 52.
* **15.5** - The default font color for group titles will now change to white if using dark theme.
* **15.4** - Fixes for Sketch 52; shared style is now being properly applied to new titles.
* **15.3** - Fixes for Sketch 52; MSSharedStyle.initWithName_firstInstance and MSSharedStyle.newInstance were both phased out.
* **15.2** - Fix for some pre-existing group title text styles not returning a color value.
* **15.1** - Fix for group title text style color modification being overwritten.
* **15.0** - Added support for global settings, and setting group title style name.
* **14.8** - Bug fix for titles not appearing when first run (due to style creation issue).
* **14.7** - Added plugin icon to manifest for Sketch 50.
* **14.6** - Another modification to account for impending changes to MSSharedObjectContainer in Sketch 50.
* **14.5** - Some modifications to account for impending changes to MSSharedObjectContainer in Sketch 50.
* **14.4** - Rolling back to previous code for Remove Unused Symbols, due to feedback that it's not working as desired.
* **14.3** - Enhancement to Remove Unused Symbols, specifically to do a better job of detecting nested overrides for nested symbols.
* **14.2** - Fix for Sketch 48 change of currentView to contentDrawView.
* **14.1** - Update to adjust the view after Symbol Organizer has been run.
* **14.0** - Added new Group Space feature and improved appearance of settings window. Improved sorting and grouping; group title case will now be ignored, and group titles which are numbers will now sort properly.
* **13.1** - Display Group Titles will now prefer to use "SFProText-Bold" by default, and if the font doesn't exist, will fall back to "SFUIText-Bold", or "HelveticaNeue-Bold". Remove Unused Symbols will now only remove symbols on current page.
* **13.0** - Remove Unused Symbols will now present checklist of removal candidates, requiring the user to review and confirm.
* **12.8** - Another attempt to ensure all/only unused symbols are removed.
* **12.7** - Fix for duplicate groups when alphabetical sorting and multiple depths confuses group definition.
* **12.6** - Fix to only gather local symbols in Sketch 47.
* **12.5** - Simplified code, and implemented enhancement to trim whitespace when generating groups (does not affect alphabetic sorting).
* **12.4** - Fix for titles becoming misaligned when Layout Direction is set to vertical and Symbol Organizer is used in Run mode.
* **12.3** - Added back symbol override protections, as it seems the isSafeToDelete function of MSSymbolMaster has a bug with nested nested symbols. Also fixed a feedback bug, for when Remove Unused Symbols would correctly leave no symbols remaining on the symbols page (would incorrectly state "There are no symbols to organize on this page").
* **12.2** - Fixed (another) issue for when Symbol Organizer is being used on a brand new document, which has no stored settings of any kind (was referring to stored settings to migrate old Symbol Organizer settings to new plugin identifier).
* **12.1** - Fixed issue for when Symbol Organizer is being used on a brand new document, which has no stored settings of any kind (was referring to stored settings to migrate old Symbol Organizer settings to new plugin identifier).
* **12.0** - Improved the Remove Unused Symbols function, it should now be very accurate as it uses the native isSafeToDelete function of MSSymbolMaster. Improved the process for which symbols and the layer list are moved around, no longer removing and re-adding (to avoid another Sketch 45 fiasco) and instead simply moving. Merged the distinct files for Config and Run into a single file. Updated plugin identifier while also preserving user’s previous settings. Made many other housekeeping optimizations.
* **11.5** - Updated default title font to SF UI Text, and will also now respect user modifications to Symbol Group Title style.
* **11.4** - Sketch 45 fix for symbol group titles.
* **11.3** - Added appcast plugin support for Sketch 45.
* **11.2** - Fix for Sketch 45.
* **11.1** - Fix for Sketch 45.
* **11.0** - Added keyboard shortcut to quickly run Symbol Organizer using last settings.

# Contact

<a class="twitter-follow-button" href="https://twitter.com/sonburn">Follow @sonburn</a>

# Support

If you find this plugin helpful, consider shouting me ☕️ via <a href="https://www.paypal.me/sonburn">PayPal</a>.

# License

Copyright (c) 2018 Jason Burns (Sonburn). See LICENSE.md for further details.
