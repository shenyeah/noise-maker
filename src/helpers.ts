let forceReloadDebounce: number | undefined;
function forceReloadSvg() {
  clearTimeout(forceReloadDebounce);
  forceReloadDebounce = setTimeout(() => {
    //Re-select every time since it's being replaced and we lose the reference
    const $svg = $demoOutput.children('svg');

    //remove any styles it has
    if ($svg.css('transform')) {
      $svg.css('transform', '');
    }

    //clone the element and replace it
    var $clone = $svg.clone();
    $svg.replaceWith($clone);

    //force it into a new GPU rendering layer
    $clone.css('transform', 'translateZ(0)');
  }, 50);
}

function updateFilterStyles(
  $tgt: JQuery<HTMLElement>,
  tgtFilterProp: string,
  val: string | number,
  isDisabled: boolean
) {
  textureStyles.filter[tgtFilterProp] = isDisabled ? null : val;
  $tgt.css('filter', getPropsAsCssString(textureStyles.filter));
}

function getPropsAsCssString(obj: IIndexableObject) {
  return Object.keys(obj)
    .map((key) => {
      const val = obj[key];
      return val == null ? '' : `${key}(${val})`;
    })
    .filter((v) => v !== '')
    .join(' ');
}

function getFormattedValue($el: JQuery<HTMLInputElement>) {
  let formatterStr = $el.data('target-value-formatter') as string;
  const selectorMatches = formatterStr.matchAll(/{{(.+?)}}/g);

  for (const match of selectorMatches) {
    const token = match[0];
    const cssSelector = match[1];
    const $tokenizedEl = $(cssSelector);
    let value = '';
    if ($tokenizedEl.is(':not(:disabled)')) {
      const suffix = $tokenizedEl.data('target-value-suffix');
      value = $tokenizedEl.val() as string;
      if (suffix) value += suffix;
    }
    formatterStr = formatterStr.replace(token, value);
  }

  return formatterStr;
}

function scrollElementIntoView(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  // Only completely visible elements return true
  const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;

  if (!isVisible) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

//----------------------------------------------------
//Toast
function showToast(state: string, message: string) {
  const $toastTemplate = $('#toast-template');
  const $newToast = $toastTemplate.clone();
  $newToast
    .removeAttr('id')
    .addClass(`text-bg-${state}`)
    .appendTo($toastTemplate.parent())
    .find('.toast-body')
    .text(message);

  const newToastEl = $newToast.get(0)!;

  bootstrap.Toast.getOrCreateInstance(newToastEl).show();

  newToastEl.addEventListener('hidden.bs.toast', () => {
    newToastEl.remove();
  });
}

//----------------------------------------------------
//Sharable links
function serializeControls(includeSize = false): IPresetSetting[] {
  //used to log out the current values to the console to manually save as presets
  let excludeFilter = ':not(:disabled)';
  if (!includeSize) {
    excludeFilter += ':not(#ctrl-enable-custom-size)';
  }

  return $controls
    .filter(excludeFilter)
    .toArray()
    .map((el) => {
      let value: IPresetValue = el.value;
      const numVal = (el as HTMLInputElement).valueAsNumber;
      if (el.type === 'checkbox') {
        value = (el as HTMLInputElement).checked;
      } else if (typeof numVal !== 'undefined' && !isNaN(numVal)) {
        value = numVal;
      }
      return { id: el.id.replace(ctrlIdPrefix, ''), value };
    });
}

function getShareableLink(): string {
  const values = serializeControls(true);
  const qs = Object.values(values)
    .map((o) => `${o.id}=${encodeURIComponent(o.value)}`)
    .join('&');

  return `${location.origin + location.pathname}?${qs}`;
}

function updateHistory() {
  clearTimeout(forceReloadDebounce);
  forceReloadDebounce = setTimeout(() => {
    const newUrl = getShareableLink();
    if (location.href !== newUrl) {
      window.history.pushState(null, document.title, newUrl);
    }
  }, 500);
}

function applySettingsFromUrl(): void {
  const settings = new URLSearchParams(location.search);
  if (settings) {
    settings.forEach((value, key) => {
      if (/^(true|false)$/.test(value)) {
        $('#' + ctrlIdPrefix + key)
          .prop('checked', /^true$/i.test(value))
          .trigger(inputEventName);
      } else {
        $('#' + ctrlIdPrefix + key)
          .val(value)
          .trigger(inputEventName);
      }
    });
  }
}
