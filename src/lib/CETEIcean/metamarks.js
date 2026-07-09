(function() {
  window.addEventListener('load', function() {
    
    var relocationRegistry = {};
    var processedIds = new Set();

    // --- PHASE 1: BUILD REGISTRY (Targets) ---
    var targetSelectors = [
      '[data-origname="metamark"][target]',
      'tei-metamark[target]',
      'metamark[target]'
    ];
    
    var allPotentialTargets = [];
    targetSelectors.forEach(function(sel) {
      allPotentialTargets = allPotentialTargets.concat(Array.from(document.querySelectorAll(sel)));
    });

    var uniqueTargets = [];
    var seenElements = new Set();
    allPotentialTargets.forEach(function(el) {
      if (!seenElements.has(el)) {
        seenElements.add(el);
        uniqueTargets.push(el);
      }
    });

    uniqueTargets.forEach(function(targetElt) {
      var targetAttr = targetElt.getAttribute("target");
      var idAttr = targetElt.getAttribute("xml:id") || targetElt.getAttribute("id");
      
      if (targetAttr && !idAttr) {
        var targetId = targetAttr.replace(/^#/, '');
        
        if (processedIds.has(targetId)) return;
        processedIds.add(targetId);

        if (!targetElt.querySelector('.metamark-relocated-text-at-original-position')) {
          var originWrapper = document.createElement("span");
          originWrapper.className = "metamark-relocated-text-at-original-position";
          originWrapper.setAttribute('id', targetId);
          while (targetElt.firstChild) {
            originWrapper.appendChild(targetElt.firstChild);
          }
          targetElt.appendChild(originWrapper);
        }

        var originWrapper = targetElt.querySelector('.metamark-relocated-text-at-original-position');
        var fragment = document.createDocumentFragment();
        
        if (originWrapper) {
          Array.from(originWrapper.childNodes).forEach(function(child) {
            if (child.nodeType === Node.ELEMENT_NODE || child.nodeType === Node.TEXT_NODE) {
              fragment.appendChild(child.cloneNode(true));
            }
          });
        }
        
        // Store both the content fragment and the reference to the target wrapper
        relocationRegistry[targetId] = {
          fragment: fragment,
          targetElement: originWrapper
        };
      }
    });

    // --- PHASE 2: MANUAL INJECTION (Sources) ---
    var sourceSelectors = [
      '[data-origname="metamark"][xml\\:id]',
      '[data-origname="metamark"][id]',
      'tei-metamark[xml\\:id]',
      'tei-metamark[id]',
      'metamark[xml\\:id]',
      'metamark[id]'
    ];

    var allPotentialSources = [];
    sourceSelectors.forEach(function(sel) {
      allPotentialSources = allPotentialSources.concat(Array.from(document.querySelectorAll(sel)));
    });

    var uniqueSources = [];
    var seenSources = new Set();
    allPotentialSources.forEach(function(el) {
      if (!seenSources.has(el)) {
        seenSources.add(el);
        uniqueSources.push(el);
      }
    });

    uniqueSources.forEach(function(sourceElt) {
      var id = sourceElt.getAttribute("xml:id") || sourceElt.getAttribute("id");
      
      if (!id) return;
      if (sourceElt.querySelector('.metamark-relocated-text-at-new-location')) return;

      // 1. Wrap explanation and extract text
      var explanationText = "";
      if (!sourceElt.querySelector('.metamark-explanation-for-relocation')) {
        var explanationWrapper = document.createElement("span");
        explanationWrapper.className = "metamark-explanation-for-relocation";
        while (sourceElt.firstChild) {
          explanationWrapper.appendChild(sourceElt.firstChild);
        }
        sourceElt.appendChild(explanationWrapper);
        explanationText = explanationWrapper.textContent.trim();
      } else {
        explanationText = sourceElt.querySelector('.metamark-explanation-for-relocation').textContent.trim();
      }

      // 2. Insert Marker (with tooltip)
      if (!sourceElt.querySelector('.metamark-marker-at-new-location')) {
        var newLocationMarker = document.createElement("span");
        newLocationMarker.className = "metamark-marker-at-new-location";
        newLocationMarker.setAttribute("id", id);
        if (explanationText) {
          newLocationMarker.title = explanationText;
          newLocationMarker.style.cursor = "help";
        }
        sourceElt.appendChild(newLocationMarker);
      }

      // 3. Inject Content (with tooltip)
      var storedData = relocationRegistry[id];
      
      if (storedData && storedData.fragment && storedData.fragment.hasChildNodes()) {
        var relocatedWrapper = document.createElement("span");
        relocatedWrapper.className = "metamark-relocated-text-at-new-location";
        
        Array.from(storedData.fragment.childNodes).forEach(function(child) {
          if (child.nodeType === Node.ELEMENT_NODE || child.nodeType === Node.TEXT_NODE) {
            relocatedWrapper.appendChild(child.cloneNode(true));
          }
        });
        
        if (relocatedWrapper.hasChildNodes()) {
          sourceElt.appendChild(relocatedWrapper);
          
          // if (explanationText) {
          //   relocatedWrapper.title = explanationText;
          //   relocatedWrapper.style.cursor = "help";
          // }
        }
      }

      // 4. Set tooltip on the original target text (for DF mode)
      if (storedData && storedData.targetElement && explanationText) {
        storedData.targetElement.title = explanationText;
        storedData.targetElement.style.cursor = "help";
      }
    });

    // --- PHASE 3: Assign Behavior ---
    var teiBehaviors = {
      tei: {
        metamark: function(elt) {
          var id = elt.getAttribute("xml:id") || elt.getAttribute("id");
          var target = elt.getAttribute("target");
          if (target && !id) return undefined;
          if (id) {
             if (elt.querySelector('.metamark-relocated-text-at-new-location')) return undefined;
          }
          return undefined;
        }
      }
    };

    window.teiBehaviors = window.teiBehaviors || {};
    window.teiBehaviors.tei = window.teiBehaviors.tei || {};
    window.teiBehaviors.tei.metamark = teiBehaviors.tei.metamark;
  });
})();