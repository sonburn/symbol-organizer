@import 'functions.js';

var onRun = function(context) {
	var pluginName = "Symbol Organizer";

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
			var layoutSettings = getLayoutSettings();

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
					// Document variables
					var pagesLoop = pages.objectEnumerator();
					var thisPage;

					// Symbol variables
					var exemptSymbols = [];
					var removedSymbolCount = 0;

					// Iterate through each page and find children
					while (thisPage = pagesLoop.nextObject()) {
						// Children variables
						var children = thisPage.children();
						var loopChildren = children.objectEnumerator();
						var child;

						// Iterate through each child...
						while (child = loopChildren.nextObject()) {
							// If child is a symbol instance and has overrides...
							if (child.class() == "MSSymbolInstance" && child.overrides()) {
								// Create object of overrides
								var overrides = child.overrides().allValues();

								// Iterate through overrides
								for (var i = 0; i < overrides.count(); i++) {
									// Function to add each override symbol ID to exempt symbols object
									pushOverrideSymbolIDtoArray(overrides.objectAtIndex(i),exemptSymbols);
								}
							}

							// If child is a symbol master...
							if (child.class() == "MSSymbolMaster") {
								// If this symbol does not reside on the symbols page...
								if (thisPage.name() != 'Symbols') {
									// Add this symbol ID to exempt symbols object
									exemptSymbols.push(String(child.symbolID()));
								} else {
									// Layer variables
									var layers = child.children();
									var loopLayers = layers.objectEnumerator();
									var layer;
									var exemptions = 0;

									// Iterate through layers
									while (layer = loopLayers.nextObject()) {
										// If layer is a symbol instance...
										if (layer.class() == "MSSymbolInstance" && layer.symbolMaster()) {
											// Add symbol master ID to exempt symbols object
											exemptSymbols.push(String(layer.symbolMaster().symbolID()));

											// Increment exemption counter
											exemptions++;
										}
									}

									// If this symbol had nested symbols...
									if (exemptions > 0) {
										// Add this symbol ID to exempt symbols object
										exemptSymbols.push(String(child.symbolID()));
									}
								}
							}
						}
					}

					// Call function to remove unused symbols
					removeUnusedSymbols();
				}

				// Title group name
				var titleGroupName = 'Titles';

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

					// Sort the layer list
					sortLayerList(symbols,layoutSettings.reverseOrder);

					// Create the group object
					var groupLayout = createGroupObject(symbols,layoutSettings.groupDepth);

					// Reset page origin
					page.setRulerBase(CGPointMake(0,0));

					// If user wants to display group titles...
					if (layoutSettings.displayTitles == 1) {
						// Title style variables
						var titleStyleName = 'Symbol Group Title';
						var titleStyleFont = 'SF UI Text Bold';
						var titleTextSize = 20;
						var titleTextHeight = 24;
						var titleTextAlign = (layoutSettings.sortDirection == 0) ? 0 : 1;
						var offsetHeight = titleTextHeight;

						// Check for title style
						var titleStyle = getTextStyleByName(context,titleStyleName);

						// If title style does not exist...
						if (!titleStyle) {
							// Add title style
							titleStyle = addTextStyle(context,titleStyleName,createTextStyle(titleStyleFont,titleTextSize,titleTextHeight,titleTextAlign));
						} else {
							// Respect potential for user modified style
							var screenTitle = MSTextLayer.new();
							screenTitle.setStringValue('Temp');
							screenTitle.setName('Temp');
							screenTitle.setStyle(titleStyle.newInstance());

							titleStyleFont = screenTitle.fontPostscriptName();
							titleTextSize = screenTitle.fontSize();
							titleTextHeight = screenTitle.lineHeight();

							if (titleTextHeight == 0) {
								offsetHeight = screenTitle.frame().height();
							}

							// Update title style
							titleStyle = updateTextStyle(context,titleStyleName,createTextStyle(titleStyleFont,titleTextSize,titleTextHeight,titleTextAlign));
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
					var gPad = parseInt(layoutSettings.gPad);
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
								titleTextX = (objectCount == 1) ? 0 : x+groupSpace+gPad+xPad;
							} else {
								titleTextY = (objectCount == 1) ? 0 : y+groupSpace+gPad+yPad;
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
								x += groupSpace + gPad + xPad;
							} else {
								// Reset x position, set the y position of the next row
								x = 0;
								y += groupSpace + gPad + yPad;
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
						doc.showMessage("Symbol layout complete! " + removedSymbolCount + " unused symbols were removed.");
					} else {
						doc.showMessage("Symbol layout complete!");
					}
				} else {
					displayDialog("There are no symbols to organize on this page.",pluginName);
				}
			}
		} else {
			displayDialog("This page contains artboards and symbols. Symbol Organizer can only be used on pages with just symbols.",pluginName);
		}
	} else {
		displayDialog("There are no symbols to organize on this page.",pluginName);
	}

	function getLayoutSettings() {
		// Setting variables
		var defaultSettings = {};
		defaultSettings.groupDepth = 1;
		defaultSettings.displayTitles = 0;
		defaultSettings.sortDirection = 0;
		defaultSettings.xPad = '100';
		defaultSettings.yPad = '100';
		defaultSettings.gPad = '150';
		defaultSettings.maxPer = '';
		defaultSettings.reverseOrder = 0;
		defaultSettings.renameSymbols = 0;
		defaultSettings.gatherSymbols = 0;
		defaultSettings.removeSymbols = 0;

		// Update default settings with cached settings
		defaultSettings = getCachedSettings(page,defaultSettings);

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

		var layoutVerticalLabel = createLabel('Vertical Space',12,NSMakeRect(140,137,140,16));
		layoutFrame.addSubview(layoutVerticalLabel);

		var layoutVerticalValue = createField(defaultSettings.yPad,NSMakeRect(140,110,60,22));
		layoutFrame.addSubview(layoutVerticalValue);

		var layoutGroupSpaceLabel = createLabel('Group Space',12,NSMakeRect(0,82,140,16));
		layoutFrame.addSubview(layoutGroupSpaceLabel);

		var layoutGroupSpaceValue = createField(defaultSettings.gPad,NSMakeRect(0,55,60,22));
		layoutFrame.addSubview(layoutGroupSpaceValue);

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

		var removeSymbolsDescription = createDescription('Removes unused symbols on the current page.\nSymbols which are nested in other symbols, or\nused as overrides, will NOT be removed.',11,NSMakeRect(18,0,282,42));
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
			layoutGroupSpaceValue,
			layoutMaxValue,
			reverseOrderCheckbox,
			renameSymbolsCheckbox,
			gatherSymbolsCheckbox,
			removeSymbolsCheckbox
		]);

		var responseCode = alertWindow.runModal();

		if (responseCode == 1000) {
			try {
				[command setValue:[groupGranularityValue indexOfSelectedItem] forKey:"groupDepth" onLayer:page];
				[command setValue:[groupTitlesCheckbox state] forKey:"displayTitles" onLayer:page];
				[command setValue:[[layoutDirectionValue selectedCell] tag] forKey:"sortDirection" onLayer:page];
				[command setValue:[layoutHorizontalValue stringValue] forKey:"xPad" onLayer:page];
				[command setValue:[layoutVerticalValue stringValue] forKey:"yPad" onLayer:page];
				[command setValue:[layoutGroupSpaceValue stringValue] forKey:"gPad" onLayer:page];
				[command setValue:[layoutMaxValue stringValue] forKey:"maxPer" onLayer:page];
				[command setValue:[reverseOrderCheckbox state] forKey:"reverseOrder" onLayer:page];
				[command setValue:[renameSymbolsCheckbox state] forKey:"renameSymbols" onLayer:page];
				[command setValue:[gatherSymbolsCheckbox state] forKey:"gatherSymbols" onLayer:page];
				[command setValue:0 forKey:"removeSymbols" onLayer:page];
			} catch(err) {
				log("Unable to save settings.");
			}

			return {
				groupDepth : [groupGranularityValue indexOfSelectedItem],
				displayTitles : [groupTitlesCheckbox state],
				sortDirection : [[layoutDirectionValue selectedCell] tag],
				xPad : [layoutHorizontalValue stringValue],
				yPad : [layoutVerticalValue stringValue],
				gPad : [layoutGroupSpaceValue stringValue],
				maxPer : [layoutMaxValue stringValue],
				reverseOrder : [reverseOrderCheckbox state],
				renameSymbols : [renameSymbolsCheckbox state],
				gatherSymbols : [gatherSymbolsCheckbox state],
				removeSymbols : [removeSymbolsCheckbox state]
			}
		} else return false;
	}

	function pushOverrideSymbolIDtoArray(overrideObject,array) {
		if (
			overrideObject.class() == "__NSDictionaryI" ||
			overrideObject.class() == "__NSDictionaryM" ||
			overrideObject.class() == "__NSSingleEntryDictionaryI" ||
			overrideObject.class() == "__NSSingleEntryDictionaryM"
		) {
			if (overrideObject.objectForKey("symbolID")) {
				array.push(String(overrideObject.objectForKey("symbolID")));
			}

			for (var i = 0; i < overrideObject.allValues().count(); i++) {
				pushOverrideSymbolIDtoArray(overrideObject.allValues().objectAtIndex(i),array);
			}
		}
	}

	function removeUnusedSymbols() {
		var count = 0;
		var symbols = context.document.documentData().allSymbols();
		var symbolsLoop = symbols.objectEnumerator();
		var symbol;

		while (symbol = symbolsLoop.nextObject()) {
			if (!symbol.hasInstances() && exemptSymbols.indexOf(String(symbol.symbolID())) == -1) {
				symbol.removeFromParent();
				count++;
				removedSymbolCount++;
			}
		}

		if (count != 0) {
			removeUnusedSymbols();
		}
	}

	function sortLayerList(symbols,order) {
		var symbols = (order == 1) ? [[symbols reverseObjectEnumerator] allObjects] : symbols;
		var symbolIndices = [];
		var symbolLoop = symbols.objectEnumerator();
		var symbol;

		while (symbol = symbolLoop.nextObject()) {
			symbolIndices.push(symbols.indexOfObject(symbol));
		}

		var removeLoop = symbols.objectEnumerator();
		var symbolToRemove;

		while (symbolToRemove = removeLoop.nextObject()) {
			symbolToRemove.removeFromParent();
		}

		for (var i = 0; i < symbolIndices.length; i++) {
			[[doc currentPage] insertLayer:symbols[i] atIndex:symbolIndices[i]];
		}
	}

	function createGroupObject(symbols,depth) {
		// Group variables
		var groupCount = 0;
		var groupLayout = [];
		var lastGroupPrefix;

		// Iterate through the symbols
		for (var i = 0; i < symbols.count(); i++) {
			// Symbol variables
			var symbol = symbols.objectAtIndex(i);
			var symbolName = symbol.name();

			// Determine a break point in the symbol name
			var breakPoint = (symbolName.indexOf("/") != -1) ? getCharPosition(symbolName,"/",depth+1) : 0;

			// Set a prefix for current group
			var thisGroupPrefix = (breakPoint > 0) ? symbolName.slice(0,breakPoint) : symbolName;

			// If this group prefix is not the same as last group
			if (lastGroupPrefix != thisGroupPrefix) {
				// Increment the group counter
				groupCount++;
			}

			// Add an entry to the group object
			groupLayout.push({
				prefix: thisGroupPrefix,
				group: groupCount
			});

			// Set the last group prefix to current prefix
			lastGroupPrefix = thisGroupPrefix;
		}

		return groupLayout;
	}

	function getCachedSettings(location,settings) {
		try {
			for (i in settings) {
				if ([command valueForKey:i onLayer:location]) {
					settings[i] = [command valueForKey:i onLayer:location];
				}
			}

			return settings;
		} catch(err) {
			log("Unable to fetch settings.");
		}
	}
};
