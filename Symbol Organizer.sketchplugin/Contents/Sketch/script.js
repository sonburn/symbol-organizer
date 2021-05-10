@import "functions.js";

var sketch = require('sketch');
var document = sketch.getSelectedDocument();
var page = document.selectedPage;

// Config
var pluginName = "Symbol Organizer",
	pluginDomain = "com.sonburn.sketchplugins.symbol-organizer",
	titleGroupName = "Titles",
	titleStyleFont = {
		fontFamily : ["SFProText-Bold","SFUIText-Bold","HelveticaNeue-Bold"],
		fontFace : "SFProText-Bold",
		fontSize : 20,
		fontColor : (isUsingDarkTheme()) ? "FFFFFF": "000000",
		lineHeight : 24,
		textAlignment : 0
	},
	debugMode = false;

// Strings
var strPageContainsArtboards = "This page contains artboards and symbols. Symbol Organizer can only be used on pages with just symbols.",
	strNoSymbolsOnPage = "There are no symbols to organize on this page.",
	strSymbolLayoutComplete = "Symbols are now organized",
	strAlertInformativeText = "Organize your symbols page alphabetically (including layer list) and into groups, determined by your symbol names.",
	strGroupGranularityDesc = "Specifies the \"/\" position in each symbol name which should define the group.",
	strSymbolMaxPerRow = "Max Per Row",
	strSymbolMaxPerCol = "Max Per Column";

var config = function(context) {
	organize(context,"config");
}

var run = function(context) {
	organize(context,"run");
}

var organize = function(context,type) {
	// Current page
	var page = context.document.currentPage();

	// If the current page does not have symbols...
	if (page.symbols().count() == 0) {
		sketch.UI.alert(pluginName,strNoSymbolsOnPage);
		return;
	}

	// If the current page does not only contain symbols...
	if (page.artboards().count() != page.symbols().count()) {
		sketch.UI.alert(pluginName,strPageContainsArtboards);
		return;
	}

	// Get layout settings
	var layoutSettings = getLayoutSettings(context,type);

	// If layout settings were retrieved...
	if (layoutSettings) {
		// Layout variables
		var x = 0;
		var y = 0;
		var gPad = parseInt(layoutSettings.gPad);
		var xPad = parseInt(layoutSettings.xPad);
		var yPad = parseInt(layoutSettings.yPad);
		var maxPer = (layoutSettings.maxPer > 0) ? layoutSettings.maxPer : 0;

		// Find titles group
		var titleGroup = findLayerByName(page,titleGroupName);

		// If titles group exists, remove it
		if (titleGroup) page.removeLayer(titleGroup);

		// Create a symbols object, of either all symbols or just Symbols page symbols
		var symbols = (layoutSettings.gatherSymbols == 1) ? (sketchVersion > 46) ? context.document.documentData().localSymbols() : context.document.documentData().allSymbols() : page.symbols();

		// Sort the symbols object by name
		var symbolSort = NSSortDescriptor.sortDescriptorWithKey_ascending('name',1);
		symbols = symbols.sortedArrayUsingDescriptors([symbolSort]);
		//symbols.sort(sortSymbolsByName);

		// if user wants to rename duplicate symbols...
		if (layoutSettings.renameSymbols == 1) {
			symbols = renameDuplicateSymbols(symbols);
		}

		// If user wants to reverse the sort order
		var sortedSymbols = (layoutSettings.reverseOrder == 1) ? symbols.reverseObjectEnumerator().allObjects() : symbols;

		// Sort the layer list
		sortLayerList(sortedSymbols,page);

		// Create the group object
		var groupLayout = createGroupObject(symbols,layoutSettings.groupDepth);

		// Reset page origin
		page.setRulerBase(CGPointMake(0,0));

		// If user wants to display group titles...
		if (layoutSettings.displayTitles == 1) {
			// Title style variables
			if (layoutSettings.sortDirection == 1) titleStyleFont.textAlignment = 1;
			var offsetHeight = titleStyleFont.lineHeight;

			// Check for title style
			var titleStyle = getTextStyleByName(context,layoutSettings.styleName.trim());

			// If title style does not exist...
			if (!titleStyle) {
				// System font variable
				var systemFontToUse;

				// Iterate through family fonts...
				for (var i = 0; i < titleStyleFont.fontFamily.length; i++) {
					// If a system font has not been determined to exist yet...
					if (!systemFontToUse) {
						// If this system font exists, set system font variable
						if (systemFontExists(titleStyleFont.fontFamily[i])) systemFontToUse = titleStyleFont.fontFamily[i];
					}
				}

				// Update the titleStyleFont object's font face to an existing system font
				titleStyleFont.fontFace = systemFontToUse;

				// Add title style
				titleStyle = addTextStyle(context,layoutSettings.styleName.trim(),createTextStyle(titleStyleFont));
			} else {
				// Title style attributes
				var titleStyleAttributes = titleStyle.style().textStyle().attributes();

				// Respect potential for user modified style
				titleStyleFont.fontFace = titleStyleAttributes.NSFont.fontDescriptor().objectForKey(NSFontNameAttribute);
				titleStyleFont.fontSize = titleStyleAttributes.NSFont.fontDescriptor().objectForKey(NSFontSizeAttribute);
				if (titleStyleAttributes.MSAttributedStringColorAttribute && titleStyleAttributes.MSAttributedStringColorAttribute.hexValue()) titleStyleFont.fontColor = titleStyleAttributes.MSAttributedStringColorAttribute.hexValue();
				titleStyleFont.lineHeight = titleStyleAttributes.NSParagraphStyle.minimumLineHeight();

				// If lineHeight (and thus offset) is 0...
				if (titleStyleFont.lineHeight == 0) {
					// Apply style to a temporary layer
					var tempLayer = MSTextLayer.new();
					tempLayer.setStringValue("Temp");

					if (titleStyle.newInstance) {
						tempLayer.setStyle(titleStyle.newInstance())
					} else {
						tempLayer.setSharedStyle(titleStyle);
					}

					// Get temporary layer height and use as offset
					offsetHeight = tempLayer.frame().height();
				}

				// Update title style
				titleStyle = updateTextStyle(context,layoutSettings.styleName.trim(),createTextStyle(titleStyleFont));
			}

			// Create new screen title group
			titleGroup = MSLayerGroup.new();
			titleGroup.setName(titleGroupName);
			titleGroup.frame().setX((layoutSettings.sortDirection == 0) ? 0 : -xPad);
			titleGroup.frame().setY((layoutSettings.sortDirection == 0) ? -(offsetHeight+yPad) : 0);
			titleGroup.setIsLocked(true);
			titleGroup.setHasClickThrough(true);
		}

		// Set tracker/counters
		var groupSpace = 0;
		var groupCount = 1;
		var objectCount = 1;

		// Iterate through the group object
		for (var i = 0; i < groupLayout.length; i++) {
			// Symbol variables
			var symbol = symbols.objectAtIndex(groupLayout[i]["index"]);
			var symbolFrame = symbol.frame();

			// If user wants to display titles, and this is the first item in the first group, or a brand new group...
			if (layoutSettings.displayTitles == 1 && (objectCount == 1 || groupCount != groupLayout[i]["group"])) {
				// Title position variables
				var titleTextX = 0;
				var titleTextY = 0;
				var titleTextAlign = 0;

				// Update title position variables per the layout direction
				if (layoutSettings.sortDirection == 0) {
					titleTextX = (objectCount == 1) ? 0 : x + groupSpace + gPad;
				} else {
					titleTextY = (objectCount == 1) ? 0 : y + groupSpace + gPad;
					titleTextAlign = 1;
				}

				// Create screen title
				var screenTitle = MSTextLayer.new();
				screenTitle.setStringValue(groupLayout[i]["prefix"]);
				screenTitle.setName(groupLayout[i]["prefix"]);

				if (titleTextAlign == 0) {
					screenTitle.frame().setY(titleTextY);
					screenTitle.frame().setX(titleTextX);
				} else {
					screenTitle.frame().setY(titleTextY);
					screenTitle.frame().setX(titleTextX - screenTitle.frame().width());
				}

				// Set screen title style
				if (titleStyle.newInstance) {
					screenTitle.setStyle(titleStyle.newInstance());
				} else {
					screenTitle.setSharedStyle(titleStyle);
				}

				// Add screen title to title group
				titleGroup.addLayers([screenTitle]);
			}

			// If the current group number doesn't match the group counter
			if (groupLayout[i]["group"] != groupCount) {
				// Update group position variables per the layout direction
				if (layoutSettings.sortDirection == 0) {
					// Reset y position, set the x position of the next row
					y = 0;
					x += groupSpace + gPad;
				} else {
					// Reset x position, set the y position of the next row
					x = 0;
					y += groupSpace + gPad;
				}

				// Reset the group space tracker
				groupSpace = 0;

				// Increment the group counter
				groupCount++;

				// Reset the object counter
				objectCount = 1;
			}

			// If the max per row is greater than 0, and object count is greater than max per row
			if (maxPer > 0 && objectCount > maxPer) {
				// Update group position variables per the layout direction
				if (layoutSettings.sortDirection == 0) {
					// Reset y position, set the x position of the next row
					y = 0;
					x += groupSpace + xPad;
				} else {
					// Reset x position, set the y position of the next row
					x = 0;
					y += groupSpace + yPad;
				}

				// Reset the group space tracker
				groupSpace = 0;

				// Reset the object counter
				objectCount = 1;
			}

			// Position the symbol
			symbolFrame.x = x;
			symbolFrame.y = y;

			// Update group position variables per the layout direction
			if (layoutSettings.sortDirection == 0) {
				// If this symbol is wider than previous symbols in row
				if (symbolFrame.width() > groupSpace) {
					// Increase the width of the row
					groupSpace = symbolFrame.width();
				}

				// Set the y position for the next symbol
				y += symbolFrame.height() + yPad;
			} else {
				// If this symbol is taller than previous symbols in row
				if (symbolFrame.height() > groupSpace) {
					// Increase the height of the row
					groupSpace = symbolFrame.height();
				}

				// Set the x position for the next symbol
				x += symbolFrame.width() + xPad;
			}

			// Increment the object counter
			objectCount++;
		}

		// If user wants to display group titles...
		if (layoutSettings.displayTitles == 1) {
			// Add title group to page
			page.addLayers([titleGroup]);

			// Resize title group
			if (sketch.version.sketch > 52) {
				titleGroup.fixGeometryWithOptions(0);
			} else {
				titleGroup.resizeToFitChildrenWithOption(0);
			}
		}

		// Collapse symbols
		actionWithType(context,"MSCollapseAllGroupsAction").doPerformAction(nil);

		// If user wants to zoom out...
		if (layoutSettings.zoomOut == 1) {
			// Adjust view
			if (sketch.version.sketch > 64) {
				context.document.canvasView().zoomToFitRect(page.contentBounds());
			} else {
				context.document.contentDrawView().zoomToFitRect(page.contentBounds());
			}
		}

		// Feedback to user
		sketch.UI.message(strSymbolLayoutComplete);

		if (!debugMode) googleAnalytics(context,"organize",type);
	}
}

var remove = function(context) {
	var exemptSymbols = getExemptSymbols(),
		removeSymbols = [],
		listItemHeight = 24,
		count = 0;

	var predicate = NSPredicate.predicateWithFormat("className == %@ && isSafeToDelete == 1","MSSymbolMaster"),
		symbols = context.document.currentPage().children().filteredArrayUsingPredicate(predicate);

	symbols.forEach(function(symbol){
		if (exemptSymbols.indexOf(String(symbol.symbolID())) == -1) removeSymbols.push(symbol);
	});

	if (removeSymbols.length == 0) {
		sketch.UI.alert(pluginName,'All symbols appear to be in use, nothing to remove!');

		return false;
	}

	var alertWindow = COSAlertWindow.new();
	alertWindow.setIcon(NSImage.alloc().initByReferencingFile(context.plugin.urlForResourceNamed("icon.png").path()));
	alertWindow.setMessageText("Remove Unused Symbols");
	alertWindow.setInformativeText("The following symbols appear to be unused. Symbols which are nested in other symbols, or used as overrides, were ignored.");

	var symbolListInnerFrameHeight = listItemHeight * (removeSymbols.length),
		symbolListFrame = NSScrollView.alloc().initWithFrame(NSMakeRect(0,0,300,200)),
		symbolListFrameSize = symbolListFrame.contentSize(),
		symbolListInnerFrame = NSView.alloc().initWithFrame(NSMakeRect(0,0,symbolListFrameSize.width,symbolListInnerFrameHeight));

	symbolListFrame.setHasVerticalScroller(true);
	symbolListInnerFrame.setFlipped(true);
	symbolListFrame.setDocumentView(symbolListInnerFrame);

	for (var i = 0; i < removeSymbols.length; i++) {
		symbolListInnerFrame.addSubview(createCheckbox({name:removeSymbols[i].name(),value:i},1,NSMakeRect(0,listItemHeight*count,300,listItemHeight)));
		count++;
	}

	symbolListInnerFrame.scrollPoint(NSMakePoint(0,0));

	alertWindow.addAccessoryView(symbolListFrame);

	alertWindow.addButtonWithTitle("Remove Selected");
	alertWindow.addButtonWithTitle("Cancel");

	var responseCode = alertWindow.runModal();

	if (responseCode == 1000) {
		var symbolsToRemove = [];

		for (var i = 0; i < removeSymbols.length; i++) {
			if ([symbolListInnerFrame subviews][i].state() == 1) symbolsToRemove.push([symbolListInnerFrame subviews][i].tag());
		}

		if (symbolsToRemove.length == 0) {
			sketch.UI.alert(pluginName,"You didn't select anything to remove.");

			return false;
		}

		for (var i = 0; i < symbolsToRemove.length; i++) {
			var symbolIndex = symbolsToRemove[i],
				symbolToRemove = removeSymbols[symbolIndex];

			symbolToRemove.removeFromParent();

			log(symbolToRemove.name() + " was removed by Symbol Organizer");
		}

		sketch.UI.message(symbolsToRemove.length + " unused symbol(s) removed");
	} else return false;

	if (!debugMode) googleAnalytics(context,"remove","remove");
}

var report = function(context) {
	openUrl("https://github.com/sonburn/symbol-organizer/issues/new");

	if (!debugMode) googleAnalytics(context,"report","report");
}

var plugins = function(context) {
	openUrl("https://sonburn.github.io/");

	if (!debugMode) googleAnalytics(context,"plugins","plugins");
}

var donate = function(context) {
	openUrl("https://www.paypal.me/sonburn");

	if (!debugMode) googleAnalytics(context,"donate","donate");
}

function getLayoutSettings(context,type) {
	// Page variables
	var page = context.document.currentPage(),
		pageInfo = page.userInfo();

	// Setting variables
	var defaultSettings = {};
	defaultSettings.globalSettings = 1;
	defaultSettings.groupDepth = 1;
	defaultSettings.sortDirection = 0;
	defaultSettings.gPad = "200";
	defaultSettings.displayTitles = 0;
	defaultSettings.styleName = "Symbol Organizer/Group Title";
	defaultSettings.reverseOrder = 0;
	defaultSettings.gatherSymbols = 0;
	defaultSettings.xPad = "100";
	defaultSettings.yPad = "100";
	defaultSettings.maxPer = "";
	defaultSettings.renameSymbols = 0;
	defaultSettings.zoomOut = 1;

	// Get document settings
	var documentSettings = updateSettingsWithDocument(context,defaultSettings);

	// If there are document settings, but no globalSettings value...
	if (pageInfo && pageInfo[pluginDomain] && !pageInfo[pluginDomain]["globalSettings"]) {
		// Ensure previous document settings are shown first
		documentSettings.globalSettings = 0;
	}

	// Determine which settings should be used
	defaultSettings = (documentSettings.globalSettings == 0) ? documentSettings : updateSettingsWithGlobal(getUserDefaults(pluginDomain),defaultSettings);

	// If type is set and equal to "config", operate in config mode...
	if (type && type == "config") {
		var fieldHeight = 22,
			fieldWidth = 60,
			labelHeight = 16,
			leftColWidth = 120,
			maxPerLabelText = (defaultSettings.sortDirection == 0) ? strSymbolMaxPerCol : strSymbolMaxPerRow,
			settingPad = 10,
			settingX = 0,
			settingY = 0,
			switchHeight = 16,
			textOffset = 2,
			windowWidth = 350;

		var alert = NSAlert.alloc().init(),
			alertIconPath = context.plugin.urlForResourceNamed("icon.png").path(),
			alertIcon = NSImage.alloc().initByReferencingFile(alertIconPath),
			alertContent = NSView.alloc().init();

		alert.setIcon(alertIcon);
		alert.setMessageText(pluginName);
		alert.setInformativeText(strAlertInformativeText);

		alertContent.setFlipped(true);

		var globalSettingsLabel = createBoldLabel("Global Settings",12,NSMakeRect(0,settingY,leftColWidth,labelHeight));
		alertContent.addSubview(globalSettingsLabel);

		var globalSettingsValue = createCheckbox({name:"Use & modify global settings",value:1},defaultSettings.globalSettings,NSMakeRect(leftColWidth,settingY,windowWidth - leftColWidth,switchHeight));
		alertContent.addSubview(globalSettingsValue);

		globalSettingsValue.setAction("callAction:");
		globalSettingsValue.setCOSJSTargetFunction(function(sender) {
			var originalSettings = (sender.state() == 0) ? updateSettingsWithDocument(context,defaultSettings) : updateSettingsWithGlobal(getUserDefaults(pluginDomain),defaultSettings);

			groupGranularityValue.selectItemAtIndex(originalSettings.groupDepth);
			groupDirectionValue.selectCellAtRow_column(originalSettings.sortDirection,0);
			groupSpaceValue.setStringValue(originalSettings.gPad);
			groupTitlesCheckbox.setState(originalSettings.displayTitles);
			styleNameValue.setStringValue(originalSettings.styleName);
			styleNameValue.setEnabled(groupTitlesCheckbox.state());
			reverseOrderCheckbox.setState(originalSettings.reverseOrder);
			gatherSymbolsCheckbox.setState(originalSettings.gatherSymbols);
			horizontalSpaceValue.setStringValue(originalSettings.xPad);
			verticalSpaceValue.setStringValue(originalSettings.yPad);
			symbolMaxPerValue.setStringValue(originalSettings.maxPer);
			renameSymbolsCheckbox.setState(originalSettings.renameSymbols);
			zoomOutCheckbox.setState(originalSettings.zoomOut);
		});

		settingY = CGRectGetMaxY(alertContent.subviews().lastObject().frame()) + settingPad;

		var divider = createDivider(NSMakeRect(0,settingY,windowWidth,1));
		alertContent.addSubview(divider);

		settingY = CGRectGetMaxY(alertContent.subviews().lastObject().frame()) + settingPad;

		var groupGranularityLabel = createBoldLabel("Group Definition",12,NSMakeRect(0,settingY + textOffset * 2,leftColWidth,labelHeight));
		alertContent.addSubview(groupGranularityLabel);

		var groupGranularityValue = createSelect(["1st","2nd","3rd","4th","5th","6th","7th","8th"],defaultSettings.groupDepth,NSMakeRect(leftColWidth,settingY,fieldWidth,28));
		alertContent.addSubview(groupGranularityValue);

		var groupGranularityExtra = createLabel("Match",12,NSMakeRect(CGRectGetMaxX(groupGranularityValue.frame()) + textOffset,settingY + textOffset * 2,60,labelHeight));
		alertContent.addSubview(groupGranularityExtra);

		settingY = CGRectGetMaxY(groupGranularityValue.frame()) + textOffset;

		var groupGranularityDesc = createDescription(strGroupGranularityDesc,11,NSMakeRect(leftColWidth,settingY,windowWidth - leftColWidth,28));
		alertContent.addSubview(groupGranularityDesc);

		settingY = CGRectGetMaxY(alertContent.subviews().lastObject().frame()) + settingPad;

		var groupDirectionLabel = createBoldLabel("Layout Direction",12,NSMakeRect(0,settingY,leftColWidth,labelHeight));
		alertContent.addSubview(groupDirectionLabel);

		var groupDirectionValue = createRadioButtons(["Horizontal","Vertical"],defaultSettings.sortDirection,0,leftColWidth,settingY);
		alertContent.addSubview(groupDirectionValue);

		groupDirectionValue.cells().objectAtIndex(0).setAction("callAction:");
		groupDirectionValue.cells().objectAtIndex(0).setCOSJSTargetFunction(function(sender) {
			symbolMaxPerLabel.setStringValue(strSymbolMaxPerCol);
		});

		groupDirectionValue.cells().objectAtIndex(1).setAction("callAction:");
		groupDirectionValue.cells().objectAtIndex(1).setCOSJSTargetFunction(function(sender) {
			symbolMaxPerLabel.setStringValue(strSymbolMaxPerRow);
		});

		settingY = CGRectGetMaxY(alertContent.subviews().lastObject().frame()) + settingPad;

		var groupSpaceLabel = createBoldLabel("Group Space",12,NSMakeRect(0,settingY,leftColWidth,labelHeight));
		alertContent.addSubview(groupSpaceLabel);

		var groupSpaceValue = createField(defaultSettings.gPad,NSMakeRect(leftColWidth,settingY,fieldWidth,fieldHeight));
		alertContent.addSubview(groupSpaceValue);

		settingY = CGRectGetMaxY(alertContent.subviews().lastObject().frame()) + settingPad + textOffset;

		var divider = createDivider(NSMakeRect(0,settingY,windowWidth,1));
		alertContent.addSubview(divider);

		settingY = CGRectGetMaxY(alertContent.subviews().lastObject().frame()) + settingPad;

		var groupTitlesCheckbox = createCheckbox({name:"Display group titles",value:1},defaultSettings.displayTitles,NSMakeRect(leftColWidth,settingY,windowWidth - leftColWidth,switchHeight));
		alertContent.addSubview(groupTitlesCheckbox);

		groupTitlesCheckbox.setAction("callAction:");
		groupTitlesCheckbox.setCOSJSTargetFunction(function(sender) {
			styleNameValue.setEnabled(sender.state());
		});

		settingY = CGRectGetMaxY(alertContent.subviews().lastObject().frame()) + settingPad;

		var styleNameLabel = createBoldLabel("Title Style Name",12,NSMakeRect(0,settingY + textOffset,leftColWidth,labelHeight));
		alertContent.addSubview(styleNameLabel);

		var styleNameValue = createField(defaultSettings.styleName,NSMakeRect(leftColWidth,settingY,windowWidth - leftColWidth,fieldHeight));
		alertContent.addSubview(styleNameValue);

		styleNameValue.setEnabled(groupTitlesCheckbox.state());

		settingY = CGRectGetMaxY(alertContent.subviews().lastObject().frame()) + settingPad;

		var divider = createDivider(NSMakeRect(0,settingY,windowWidth,1));
		alertContent.addSubview(divider);

		settingY = CGRectGetMaxY(alertContent.subviews().lastObject().frame()) + settingPad;

		var reverseOrderLabel = createBoldLabel("Layer List",12,NSMakeRect(0,settingY,leftColWidth,labelHeight));
		alertContent.addSubview(reverseOrderLabel);

		var reverseOrderCheckbox = createCheckbox({name:"Reverse sort order",value:1},defaultSettings.reverseOrder,NSMakeRect(leftColWidth,settingY,windowWidth - leftColWidth,switchHeight));
		alertContent.addSubview(reverseOrderCheckbox);

		settingY = CGRectGetMaxY(alertContent.subviews().lastObject().frame()) + settingPad;

		var divider = createDivider(NSMakeRect(0,settingY,windowWidth,1));
		alertContent.addSubview(divider);

		settingY = CGRectGetMaxY(alertContent.subviews().lastObject().frame()) + settingPad;

		var gatherSymbolsCheckbox = createCheckbox({name:"Gather symbols from other pages",value:1},defaultSettings.gatherSymbols,NSMakeRect(leftColWidth,settingY,windowWidth - leftColWidth,switchHeight));
		alertContent.addSubview(gatherSymbolsCheckbox);

		settingY = CGRectGetMaxY(alertContent.subviews().lastObject().frame()) + settingPad;

		var spacingLabel = createBoldLabel("Spacing",12,NSMakeRect(0,settingY + textOffset,leftColWidth,labelHeight));
		alertContent.addSubview(spacingLabel);

		var horizontalSpaceValue = createField(defaultSettings.xPad,NSMakeRect(leftColWidth,settingY,fieldWidth,fieldHeight));
		alertContent.addSubview(horizontalSpaceValue);

		settingX = CGRectGetMaxX(alertContent.subviews().lastObject().frame()) + textOffset;

		var horizontalSpaceLabel = createLabel("X",12,NSMakeRect(settingX,settingY + textOffset,leftColWidth,labelHeight));
		alertContent.addSubview(horizontalSpaceLabel);

		var verticalSpaceValue = createField(defaultSettings.yPad,NSMakeRect(settingX + settingPad * 3,settingY,fieldWidth,fieldHeight));
		alertContent.addSubview(verticalSpaceValue);

		settingX = CGRectGetMaxX(alertContent.subviews().lastObject().frame()) + textOffset;

		var verticalSpaceLabel = createLabel("Y",12,NSMakeRect(settingX,settingY + textOffset,leftColWidth,labelHeight));
		alertContent.addSubview(verticalSpaceLabel);

		settingY = CGRectGetMaxY(alertContent.subviews().lastObject().frame()) + settingPad;

		var symbolMaxPerLabel = createBoldLabel(maxPerLabelText,12,NSMakeRect(0,settingY + textOffset,leftColWidth,labelHeight));
		alertContent.addSubview(symbolMaxPerLabel);

		var symbolMaxPerValue = createField(defaultSettings.maxPer,NSMakeRect(leftColWidth,settingY,fieldWidth,fieldHeight));
		alertContent.addSubview(symbolMaxPerValue);

		settingY = CGRectGetMaxY(alertContent.subviews().lastObject().frame()) + settingPad;

		var renameSymbolsCheckbox = createCheckbox({name:"Sequentially number duplicates",value:1},defaultSettings.renameSymbols,NSMakeRect(leftColWidth,settingY,windowWidth - leftColWidth,switchHeight));
		alertContent.addSubview(renameSymbolsCheckbox);

		settingY = CGRectGetMaxY(alertContent.subviews().lastObject().frame()) + settingPad;

		var zoomOutCheckbox = createCheckbox({name:"Zoom & center after organizing",value:1},defaultSettings.zoomOut,NSMakeRect(leftColWidth,settingY,windowWidth - leftColWidth,switchHeight));
		alertContent.addSubview(zoomOutCheckbox);

		alertContent.frame = NSMakeRect(0,0,windowWidth,CGRectGetMaxY(zoomOutCheckbox.frame()));

		alert.accessoryView = alertContent;

		var buttonOrganize = alert.addButtonWithTitle("Organize");
		var buttonCancel = alert.addButtonWithTitle("Cancel");

		setKeyOrder(alert,[
			globalSettingsValue,
			groupGranularityValue,
			groupDirectionValue,
			groupSpaceValue,
			groupTitlesCheckbox,
			styleNameValue,
			reverseOrderCheckbox,
			gatherSymbolsCheckbox,
			horizontalSpaceValue,
			verticalSpaceValue,
			symbolMaxPerValue,
			renameSymbolsCheckbox,
			zoomOutCheckbox,
			buttonOrganize
		]);

		var responseCode = alert.runModal();

		if (responseCode == 1000) {
			if (globalSettingsValue.state() == 1) {
				sketch.Settings.setLayerSettingForKey(page,"globalSettings",globalSettingsValue.state());

				var userDefaults = getUserDefaults(pluginDomain);

				userDefaults.setObject_forKey(groupGranularityValue.indexOfSelectedItem(),"groupDepth");
				userDefaults.setObject_forKey(groupDirectionValue.selectedCell().tag(),"sortDirection");
				userDefaults.setObject_forKey(groupSpaceValue.stringValue(),"gPad");
				userDefaults.setObject_forKey(groupTitlesCheckbox.state(),"displayTitles");
				userDefaults.setObject_forKey(styleNameValue.stringValue(),"styleName");
				userDefaults.setObject_forKey(reverseOrderCheckbox.state(),"reverseOrder");
				userDefaults.setObject_forKey(gatherSymbolsCheckbox.state(),"gatherSymbols");
				userDefaults.setObject_forKey(horizontalSpaceValue.stringValue(),"xPad");
				userDefaults.setObject_forKey(verticalSpaceValue.stringValue(),"yPad");
				userDefaults.setObject_forKey(symbolMaxPerValue.stringValue(),"maxPer");
				userDefaults.setObject_forKey(renameSymbolsCheckbox.state(),"renameSymbols");
				userDefaults.setObject_forKey(zoomOutCheckbox.state(),"zoomOut");
				userDefaults.synchronize();
			} else {
				sketch.Settings.setLayerSettingForKey(page,"globalSettings",globalSettingsValue.state());
				sketch.Settings.setLayerSettingForKey(page,"groupDepth",groupGranularityValue.indexOfSelectedItem());
				sketch.Settings.setLayerSettingForKey(page,"sortDirection",groupDirectionValue.selectedCell().tag());
				sketch.Settings.setLayerSettingForKey(page,"gPad",groupSpaceValue.stringValue());
				sketch.Settings.setLayerSettingForKey(page,"displayTitles",groupTitlesCheckbox.state());
				sketch.Settings.setLayerSettingForKey(page,"styleName",styleNameValue.stringValue());
				sketch.Settings.setLayerSettingForKey(page,"reverseOrder",reverseOrderCheckbox.state());
				sketch.Settings.setLayerSettingForKey(page,"gatherSymbols",gatherSymbolsCheckbox.state());
				sketch.Settings.setLayerSettingForKey(page,"xPad",horizontalSpaceValue.stringValue());
				sketch.Settings.setLayerSettingForKey(page,"yPad",verticalSpaceValue.stringValue());
				sketch.Settings.setLayerSettingForKey(page,"maxPer",symbolMaxPerValue.stringValue());
				sketch.Settings.setLayerSettingForKey(page,"renameSymbols",renameSymbolsCheckbox.state());
				sketch.Settings.setLayerSettingForKey(page,"zoomOut",zoomOutCheckbox.state());
			}

			return {
				groupDepth : groupGranularityValue.indexOfSelectedItem(),
				sortDirection : groupDirectionValue.selectedCell().tag(),
				gPad : groupSpaceValue.stringValue(),
				displayTitles : groupTitlesCheckbox.state(),
				styleName : styleNameValue.stringValue(),
				reverseOrder : reverseOrderCheckbox.state(),
				gatherSymbols : gatherSymbolsCheckbox.state(),
				xPad : horizontalSpaceValue.stringValue(),
				yPad : verticalSpaceValue.stringValue(),
				maxPer : symbolMaxPerValue.stringValue(),
				renameSymbols : renameSymbolsCheckbox.state(),
				zoomOut : zoomOutCheckbox.state()
			}
		} else return false;
	}
	// Otherwise operate in run mode...
	else {
		// Return updated settings
		return {
			groupDepth : defaultSettings.groupDepth,
			sortDirection : defaultSettings.sortDirection,
			gPad : defaultSettings.gPad,
			displayTitles : defaultSettings.displayTitles,
			styleName : defaultSettings.styleName,
			reverseOrder : defaultSettings.reverseOrder,
			gatherSymbols : defaultSettings.gatherSymbols,
			xPad : defaultSettings.xPad,
			yPad : defaultSettings.yPad,
			maxPer : defaultSettings.maxPer,
			renameSymbols : defaultSettings.renameSymbols,
			zoomOut : defaultSettings.zoomOut
		}
	}
}
