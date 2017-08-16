![Symbol Organizer](https://raw.githubusercontent.com/sonburn/symbol-organizer/master/logo.png)

Organize your symbols page, and layer list, alphabetically and into groupings determined by your symbol names. Also provides the ability to choose the granularity of the groups, layout symbols horizontally or vertically, set a maximum of symbols per row/column, reverse the layer list sort direction, sequentially rename duplicate symbols, gather symbols from other pages, and remove unused symbols (symbols which are nested in other symbols, or used as overrides, will NOT be removed).

![Symbol Organizer](https://raw.githubusercontent.com/sonburn/symbol-organizer/master/Screenshots/Symbol%20Organizer.png)

<a href="http://bit.ly/SketchRunnerWebsite"><img height="40" width="160" src="http://sketchrunner.com/img/badge_blue.png"></a>

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

## 12.1

Fixed issue for when Symbol Organizer is being used on a brand new document, which has no stored settings of any kind (was referring to stored settings to migrate old Symbol Organizer settings to new plugin identifier).

## 12.0

Improved the Remove Unused Symbols function, it should now be very accurate as it uses the native isSafeToDelete function of MSSymbolMaster. Improved the process for which symbols and the layer list are moved around, no longer removing and re-adding (to avoid another Sketch 45 fiasco) and instead simply moving. Merged the distinct files for Config and Run into a single file. Updated plugin identifier while also preserving user’s previous settings. Made many other housekeeping optimizations.

## 11.5

Updated default title font to SF UI Text, and will also now respect user modifications to Symbol Group Title style.

## 11.4

Sketch 45 fix for symbol group titles.

## 11.3

Added appcast plugin support for Sketch 45.

## 11.2

Fix for Sketch 45.

## 11.1

Fix for Sketch 45.

## 11.0

Added keyboard shortcut to quickly run Symbol Organizer using last settings.

# Contact & Support

* https://twitter.com/sonburn
* https://www.paypal.me/sonburn
