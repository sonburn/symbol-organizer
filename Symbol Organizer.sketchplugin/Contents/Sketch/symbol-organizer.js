@import 'functions.js';

// Configuration
var pluginName = "Symbol Organizer";
var pluginDomain = "com.sonburn.sketchplugins.symbol-organizer";
var oldPluginDomain = "com.example.sketch.44673736-18ee-470e-b22a-f17fbb378238";
var titleGroupName = 'Titles';

// Strings
var strPageContainsArtboards = "This page contains artboards and symbols. Symbol Organizer can only be used on pages with just symbols.";
var strNoSymbolsOnPage = "There are no symbols to organize on this page.";
var strSymbolLayoutComplete = "Symbols are now organized";
var strSymbolLayoutCompleteWithRemoves = " unused symbol(s) removed";
var strProblemFetchingSettings = "Unable to fetch settings";
var strProblemSavingSettings = "Unable to save settings";

// Style variables
var titleStyleName = "Symbol Organizer/Group Title";
var titleStyleFont = {
	fontFace : "SF UI Text Bold",
	fontSize : 20,
	lineHeight : 24,
	textAlignment : 0
}

// Function to configure and run Symbol Organizer
var config = function(context) {
	// Document variables
	var doc = context.document;
	var command = context.command;
	var pages = doc.pages();
	var page = doc.currentPage();

	// If the current page has symbols...
	if (page.symbols().count() != 0) {
		// If the current page only contains symbols...
		if (page.artboards().count() == page.symbols().count()) {
			// Get layout settings
			var layoutSettings = getLayoutSettings(context,"config");

			// If layout settings were retrieved...
			if (layoutSettings) {
				// Layout variables
				var x = 0;
				var y = 0;
				var xPad = parseInt(layoutSettings.xPad);
				var yPad = parseInt(layoutSettings.yPad);
				var maxPer = (layoutSettings.maxPer > 0) ? layoutSettings.maxPer : 0;

				// If user wants to remove unused symbols...
				if (layoutSettings.removeSymbols == 1) {
					// Remove unused symbols
					var removedSymbolCount = removeUnusedSymbols(context,pluginDomain);
				}

				// Find titles group
				var titleGroup = findLayerByName(page,titleGroupName);

				// If titles group exists, remove it
				if (titleGroup) page.removeLayer(titleGroup);

				// If the document still has symbols...
				if (page.symbols().count() != 0) {
					// Create a symbols object, of either all symbols or just Symbols page symbols
					var symbols = (layoutSettings.gatherSymbols == 1) ? doc.documentData().allSymbols() : page.symbols();

					// Sort the symbols object by name
					var sortByName = [NSSortDescriptor sortDescriptorWithKey:"name" ascending:1];
					symbols = [symbols sortedArrayUsingDescriptors:[sortByName]];

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
						var titleStyle = getTextStyleByName(context,titleStyleName);

						// If title style does not exist...
						if (!titleStyle) {
							// Add title style
							titleStyle = addTextStyle(context,titleStyleName,createTextStyle(titleStyleFont));
						} else {
							// Respect potential for user modified style
							var tempLayer = MSTextLayer.new();
							tempLayer.setStringValue('Temp');
							tempLayer.setName('Temp');
							tempLayer.setStyle(titleStyle.newInstance());

							titleStyleFont.fontFace = tempLayer.fontPostscriptName();
							titleStyleFont.fontSize = tempLayer.fontSize();
							titleStyleFont.lineHeight = tempLayer.lineHeight();

							if (titleStyleFont.lineHeight == 0) {
								offsetHeight = tempLayer.frame().height();
							}

							// Update title style
							titleStyle = updateTextStyle(context,titleStyleName,createTextStyle(titleStyleFont));
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
						var symbol = symbols.objectAtIndex(i);
						var symbolFrame = symbol.frame();

						// If user wants to display titles, and this is the first item in the first group, or a brand new group...
						if (layoutSettings.displayTitles == 1 && (objectCount == 1 || groupCount != groupLayout[i]['group'])) {
							// Title position variables
							var titleTextX = 0;
							var titleTextY = 0;
							var titleTextAlign = 0;

							// Update title position variables per the layout direction
							if (layoutSettings.sortDirection == 0) {
								titleTextX = (objectCount == 1) ? 0 : x+groupSpace+xPad;
							} else {
								titleTextY = (objectCount == 1) ? 0 : y+groupSpace+yPad;
								titleTextAlign = 1;
							}

							// Create screen title
							var screenTitle = MSTextLayer.new();
							screenTitle.setStringValue(groupLayout[i]['prefix']);
							screenTitle.setName(groupLayout[i]['prefix']);

							if (titleTextAlign == 0) {
								screenTitle.frame().setY(titleTextY);
								screenTitle.frame().setX(titleTextX);
							} else {
								screenTitle.frame().setY(titleTextY);
								screenTitle.frame().setX(titleTextX-screenTitle.frame().width());
							}

							// Set screen title style
							screenTitle.setStyle(titleStyle.newInstance());

							// Add screen title to title group
							titleGroup.addLayers([screenTitle]);
						}

						// If the current group number doesn't match the group counter
						if (groupLayout[i]['group'] != groupCount) {
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
						titleGroup.resizeToFitChildrenWithOption(0);
					}

					// Collapse symbols
					actionWithType(context,"MSCollapseAllGroupsAction").doPerformAction(nil);

					// Feedback to user
					if (layoutSettings.removeSymbols == 1 && removedSymbolCount > 0) {
						doc.showMessage(strSymbolLayoutComplete + ", " + removedSymbolCount + strSymbolLayoutCompleteWithRemoves);
					} else {
						doc.showMessage(strSymbolLayoutComplete);
					}
				} else {
					// Feedback to user
					if (layoutSettings.removeSymbols == 1 && removedSymbolCount > 0) {
						doc.showMessage(strSymbolLayoutComplete + ", " + removedSymbolCount + strSymbolLayoutCompleteWithRemoves);
					} else {
						displayDialog(strNoSymbolsOnPage,pluginName);
					}
				}
			}
			// If layout settings were not retrieved...
			else {
				// Don't do anything as the user likely canceled
			}
		}
		// If the current page does not only contain symbols...``
		else {
			displayDialog(strPageContainsArtboards,pluginName);
		}
	}
	// If the current page does not have symbols...
	else {
		displayDialog(strNoSymbolsOnPage,pluginName);
	}
};

// Function to run Symbol Organizer using last settings
var run = function(context) {
	// Document variables
	var doc = context.document;
	var command = context.command;
	var pages = doc.pages();
	var page = doc.currentPage();

	// If the current page has symbols...
	if (page.symbols().count() != 0) {
		// If the current page only contains symbols...
		if (page.artboards().count() == page.symbols().count()) {
			// Get layout settings
			var layoutSettings = getLayoutSettings(context);

			// If layout settings were provided...
			if (layoutSettings) {
				// Layout variables
				var x = 0;
				var y = 0;
				var xPad = parseInt(layoutSettings.xPad);
				var yPad = parseInt(layoutSettings.yPad);
				var maxPer = (layoutSettings.maxPer > 0) ? layoutSettings.maxPer : 0;

				// If user wants to remove unused symbols...
				if (layoutSettings.removeSymbols == 1) {
					// Remove unused symbols
					var removedSymbolCount = removeUnusedSymbols(context,pluginDomain);
				}

				// Find titles group
				var titleGroup = findLayerByName(page,titleGroupName);

				// If titles group exists, remove it
				if (titleGroup) page.removeLayer(titleGroup);

				// If the document still has symbols...
				if (page.symbols().count() != 0) {
					// Create a symbols object, of either all symbols or just Symbols page symbols
					var symbols = (layoutSettings.gatherSymbols == 1) ? doc.documentData().allSymbols() : page.symbols();

					// Sort the symbols object by name
					var sortByName = [NSSortDescriptor sortDescriptorWithKey:"name" ascending:1];
					symbols = [symbols sortedArrayUsingDescriptors:[sortByName]];

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
						var titleTextAlign = (layoutSettings.sortDirection == 0) ? 0 : 1;
						var offsetHeight = titleStyleFont.lineHeight;

						// Check for title style
						var titleStyle = getTextStyleByName(context,titleStyleName);

						// If title style does not exist...
						if (!titleStyle) {
							// Add title style
							titleStyle = addTextStyle(context,titleStyleName,createTextStyle(titleStyleFont));
						} else {
							// Respect potential for user modified style
							var screenTitle = MSTextLayer.new();
							screenTitle.setStringValue('Temp');
							screenTitle.setName('Temp');
							screenTitle.setStyle(titleStyle.newInstance());

							titleStyleFont.fontFace = screenTitle.fontPostscriptName();
							titleStyleFont.fontSize = screenTitle.fontSize();
							titleStyleFont.lineHeight = screenTitle.lineHeight();

							if (titleStyleFont.lineHeight == 0) {
								offsetHeight = screenTitle.frame().height();
							}

							// Update title style
							titleStyle = updateTextStyle(context,titleStyleName,createTextStyle(titleStyleFont));
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
						var symbol = symbols.objectAtIndex(i);
						var symbolFrame = symbol.frame();

						// If user wants to display titles, and this is the first item in the first group, or a brand new group...
						if (layoutSettings.displayTitles == 1 && (objectCount == 1 || groupCount != groupLayout[i]['group'])) {
							// Title position variables
							var titleTextX = 0;
							var titleTextY = 0;
							var titleTextAlign = 0;

							// Update title position variables per the layout direction
							if (layoutSettings.sortDirection == 0) {
								titleTextX = (objectCount == 1) ? 0 : x+groupSpace+xPad;
							} else {
								titleTextY = (objectCount == 1) ? 0 : y+groupSpace+yPad;
								titleTextAlign = 1;
							}

							// Create screen title
							var screenTitle = MSTextLayer.new();
							screenTitle.setStringValue(groupLayout[i]['prefix']);
							screenTitle.setName(groupLayout[i]['prefix']);

							if (titleTextAlign == 0) {
								screenTitle.frame().setY(titleTextY);
								screenTitle.frame().setX(titleTextX);
							} else {
								screenTitle.frame().setY(titleTextY);
								screenTitle.frame().setX(titleTextX-screenTitle.frame().width());
							}

							// Set screen title style
							screenTitle.setStyle(titleStyle.newInstance());

							// Add screen title to title group
							titleGroup.addLayers([screenTitle]);
						}

						// If the current group number doesn't match the group counter
						if (groupLayout[i]['group'] != groupCount) {
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
						titleGroup.resizeToFitChildrenWithOption(0);
					}

					// Collapse symbols
					actionWithType(context,"MSCollapseAllGroupsAction").doPerformAction(nil);

					// Feedback to user
					if (layoutSettings.removeSymbols == 1 && removedSymbolCount > 0) {
						doc.showMessage(strSymbolLayoutComplete + ", " + removedSymbolCount + strSymbolLayoutCompleteWithRemoves);
					} else {
						doc.showMessage(strSymbolLayoutComplete);
					}
				} else {
					// Feedback to user
					if (layoutSettings.removeSymbols == 1 && removedSymbolCount > 0) {
						doc.showMessage(strSymbolLayoutComplete + ", " + removedSymbolCount + strSymbolLayoutCompleteWithRemoves);
					} else {
						displayDialog(strNoSymbolsOnPage,pluginName);
					}
				}
			}
			// If layout settings were not retrieved...
			else {
				// Don't do anything as the user likely canceled
			}
		} else {
			displayDialog(strPageContainsArtboards,pluginName);
		}
	} else {
		displayDialog(strNoSymbolsOnPage,pluginName);
	}
};

function getLayoutSettings(context,type) {
	// Document variables
	var page = context.document.currentPage();

	// Setting variables
	var defaultSettings = {};
	defaultSettings.groupDepth = 1;
	defaultSettings.displayTitles = 0;
	defaultSettings.sortDirection = 0;
	defaultSettings.xPad = '100';
	defaultSettings.yPad = '100';
	defaultSettings.maxPer = '';
	defaultSettings.reverseOrder = 0;
	defaultSettings.renameSymbols = 0;
	defaultSettings.gatherSymbols = 0;
	defaultSettings.removeSymbols = 0;

	// Update default settings with cached settings
	defaultSettings = getCachedSettings(context,page,defaultSettings);

	// If type is set and equal to "config", operate in config mode...
	if (type && type == "config") {
		// Establish the alert window
		var alertWindow = COSAlertWindow.new();
		alertWindow.setIcon(NSImage.alloc().initByReferencingFile(context.plugin.urlForResourceNamed("icon.png").path()));
		alertWindow.setMessageText(pluginName);

		// Grouping options
		var groupFrame = NSView.alloc().initWithFrame(NSMakeRect(0,0,300,124));
		alertWindow.addAccessoryView(groupFrame);

		var groupGranularityLabel = createLabel('Group Definition',12,NSMakeRect(0,108,140,16));
		groupFrame.addSubview(groupGranularityLabel);

		var groupGranularityDescription = createDescription('Symbol Organizer uses a "/" in the name of\neach symbol to determine the grouping. This\nsetting specifies which "/" should be used.',11,NSMakeRect(0,62,300,42));
		groupFrame.addSubview(groupGranularityDescription);

		var groupGranularityValue = createSelect(['1st','2nd','3rd','4th','5th','6th','7th','8th'],defaultSettings.groupDepth,NSMakeRect(0,26,60,28));
		groupFrame.addSubview(groupGranularityValue);

		var groupTitlesCheckbox = createCheckbox({name:"Display group titles",value:1},defaultSettings.displayTitles,NSMakeRect(0,0,300,18));
		groupFrame.addSubview(groupTitlesCheckbox);

		// Layout options
		var layoutFrame = NSView.alloc().initWithFrame(NSMakeRect(0,0,300,239));
		alertWindow.addAccessoryView(layoutFrame);

		var layoutDirectionLabel = createLabel('Layout Direction',12,NSMakeRect(0,208,140,16));
		layoutFrame.addSubview(layoutDirectionLabel);

		var layoutDirectionValue = createRadioButtons(['Horizontal','Vertical'],defaultSettings.sortDirection,0,0,153);
		layoutFrame.addSubview(layoutDirectionValue);

		var layoutHorizontalLabel = createLabel('Horizontal Space',12,NSMakeRect(0,137,140,16));
		layoutFrame.addSubview(layoutHorizontalLabel);

		var layoutHorizontalValue = createField(defaultSettings.xPad,NSMakeRect(0,110,60,22));
		layoutFrame.addSubview(layoutHorizontalValue);

		var layoutVerticalLabel = createLabel('Vertical Space',12,NSMakeRect(0,82,140,16));
		layoutFrame.addSubview(layoutVerticalLabel);

		var layoutVerticalValue = createField(defaultSettings.yPad,NSMakeRect(0,55,60,22));
		layoutFrame.addSubview(layoutVerticalValue);

		var layoutMaxLabel = createLabel('Max Per Row/Column',12,NSMakeRect(0,27,140,16));
		layoutFrame.addSubview(layoutMaxLabel);

		var layoutMaxValue = createField(defaultSettings.maxPer,NSMakeRect(0,0,60,22));
		layoutFrame.addSubview(layoutMaxValue);

		// Other options
		var otherFrame = NSView.alloc().initWithFrame(NSMakeRect(0,0,300,161));
		alertWindow.addAccessoryView(otherFrame);

		var reverseOrderCheckbox = createCheckbox({name:"Reverse layer list sort order",value:1},defaultSettings.reverseOrder,NSMakeRect(0,126,300,18));
		otherFrame.addSubview(reverseOrderCheckbox);

		var renameSymbolsCheckbox = createCheckbox({name:"Sequentially number duplicate symbols",value:1},defaultSettings.renameSymbols,NSMakeRect(0,98,300,18));
		otherFrame.addSubview(renameSymbolsCheckbox);

		var gatherSymbolsCheckbox = createCheckbox({name:"Gather symbols from other pages",value:1},defaultSettings.gatherSymbols,NSMakeRect(0,70,300,18));
		otherFrame.addSubview(gatherSymbolsCheckbox);

		var removeSymbolsCheckbox = createCheckbox({name:"Remove unused symbols",value:1},defaultSettings.removeSymbols,NSMakeRect(0,42,300,18));
		otherFrame.addSubview(removeSymbolsCheckbox);

		var removeSymbolsDescription = createDescription('Removes unused symbols in your document.\nSymbols which are nested in other symbols, or\nused as overrides, will NOT be removed.',11,NSMakeRect(18,0,282,42));
		otherFrame.addSubview(removeSymbolsDescription);

		// Buttons
		alertWindow.addButtonWithTitle('OK');
		alertWindow.addButtonWithTitle('Cancel');

		// Set key order and first responder
		setKeyOrder(alertWindow,[
			groupGranularityValue,
			groupTitlesCheckbox,
			layoutDirectionValue,
			layoutHorizontalValue,
			layoutVerticalValue,
			layoutMaxValue,
			reverseOrderCheckbox,
			renameSymbolsCheckbox,
			gatherSymbolsCheckbox,
			removeSymbolsCheckbox
		]);

		var responseCode = alertWindow.runModal();

		if (responseCode == 1000) {
			try {
				context.command.setValue_forKey_onLayer([groupGranularityValue indexOfSelectedItem],"groupDepth",page);
				context.command.setValue_forKey_onLayer([groupTitlesCheckbox state],"displayTitles",page);
				context.command.setValue_forKey_onLayer([[layoutDirectionValue selectedCell] tag],"sortDirection",page);
				context.command.setValue_forKey_onLayer([layoutHorizontalValue stringValue],"xPad",page);
				context.command.setValue_forKey_onLayer([layoutVerticalValue stringValue],"yPad",page);
				context.command.setValue_forKey_onLayer([layoutMaxValue stringValue],"maxPer",page);
				context.command.setValue_forKey_onLayer([reverseOrderCheckbox state],"reverseOrder",page);
				context.command.setValue_forKey_onLayer([renameSymbolsCheckbox state],"renameSymbols",page);
				context.command.setValue_forKey_onLayer([gatherSymbolsCheckbox state],"gatherSymbols",page);
				context.command.setValue_forKey_onLayer(0,"removeSymbols",page);

				if (page.userInfo() && page.userInfo().valueForKey(oldPluginDomain)) {
					context.command.setValue_forKey_onLayer_forPluginIdentifier(nil,"groupDepth",page,oldPluginDomain);
					context.command.setValue_forKey_onLayer_forPluginIdentifier(nil,"displayTitles",page,oldPluginDomain);
					context.command.setValue_forKey_onLayer_forPluginIdentifier(nil,"sortDirection",page,oldPluginDomain);
					context.command.setValue_forKey_onLayer_forPluginIdentifier(nil,"xPad",page,oldPluginDomain);
					context.command.setValue_forKey_onLayer_forPluginIdentifier(nil,"yPad",page,oldPluginDomain);
					context.command.setValue_forKey_onLayer_forPluginIdentifier(nil,"maxPer",page,oldPluginDomain);
					context.command.setValue_forKey_onLayer_forPluginIdentifier(nil,"reverseOrder",page,oldPluginDomain);
					context.command.setValue_forKey_onLayer_forPluginIdentifier(nil,"renameSymbols",page,oldPluginDomain);
					context.command.setValue_forKey_onLayer_forPluginIdentifier(nil,"gatherSymbols",page,oldPluginDomain);
					context.command.setValue_forKey_onLayer_forPluginIdentifier(nil,"removeSymbols",page,oldPluginDomain);
					context.command.setValue_forKey_onLayer_forPluginIdentifier(nil,"sortOrder",page,oldPluginDomain);

					log("Old settings for Symbol Organizer have been purged.")
				}
			} catch(err) {
				log(strProblemSavingSettings);
			}

			return {
				groupDepth : [groupGranularityValue indexOfSelectedItem],
				displayTitles : [groupTitlesCheckbox state],
				sortDirection : [[layoutDirectionValue selectedCell] tag],
				xPad : [layoutHorizontalValue stringValue],
				yPad : [layoutVerticalValue stringValue],
				maxPer : [layoutMaxValue stringValue],
				reverseOrder : [reverseOrderCheckbox state],
				renameSymbols : [renameSymbolsCheckbox state],
				gatherSymbols : [gatherSymbolsCheckbox state],
				removeSymbols : [removeSymbolsCheckbox state]
			}
		} else return false;
	}
	// Otherwise operate in run mode...
	else {
		// Return updated settings
		return {
			groupDepth : defaultSettings.groupDepth,
			displayTitles : defaultSettings.displayTitles,
			sortDirection : defaultSettings.sortDirection,
			xPad : defaultSettings.xPad,
			yPad : defaultSettings.yPad,
			maxPer : defaultSettings.maxPer,
			reverseOrder : defaultSettings.reverseOrder,
			renameSymbols : defaultSettings.renameSymbols,
			gatherSymbols : defaultSettings.gatherSymbols,
			removeSymbols : defaultSettings.removeSymbols
		}
	}
}

function getCachedSettings(context,location,settings) {
	var usePluginDomain = (context.document.currentPage().userInfo() && context.document.currentPage().userInfo().valueForKey(oldPluginDomain)) ? oldPluginDomain : pluginDomain;

	try {
		for (i in settings) {
			var value = context.command.valueForKey_onLayer_forPluginIdentifier(i,location,usePluginDomain);
			if (value) settings[i] = value;
		}

		return settings;
	} catch(err) {
		log(strProblemFetchingSettings);
	}
}
