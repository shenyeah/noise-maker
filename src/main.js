const svgNs = 'http://www.w3.org/2000/svg';
let $baseFrequencyX;
let $baseFrequencyY;
const textureStyles = {
  filter: {},
};

$(() => {
  $baseFrequencyX = $('#ctrl-base-frequency-x');
  $baseFrequencyY = $('#ctrl-base-frequency-y');

  //Loop through all the controls and run an event any time one changes
  $('#svg-controls .form-control-wrapper').each((_i, ctrl) => {
    const $input = $(ctrl).find('select, input:not([data-enable]):not([data-toggle-visibility])');
    const $enableInput = $(ctrl).find('input[data-enable]');
    const $toggleVisibilityInput = $(ctrl).find(
      'input[data-toggle-visibility], select[data-toggle-visibility]'
    );
    const $outputDisplay = $(ctrl).find('output');

    //Checkboxes to enable/disable other inputs
    if ($enableInput.length) {
      const $enableTargets = $($enableInput.data('enable'));
      $enableInput.on('input', () => {
        const isChecked = $enableInput.is(':checked');
        $enableTargets.attr('disabled', !isChecked);

        if ($enableInput.attr('id') === 'ctrl-enable-lighting') {
          //special condition when enabling/disabling lighting
          const $svgFilter = $('#noise-filter');
          if (isChecked) {
            $svgFilter.append(createLightingElement());
          } else {
            $svgFilter.find('feDiffuseLighting, feSpecularLighting').remove();
          }
        }

        $enableTargets.each((_i, t) => updateTexture($(t), $outputDisplay));
        $enableTargets.trigger('input');
      });

      //Initialize
      $enableInput.trigger('input');
    }

    if ($toggleVisibilityInput.length) {
      if ($toggleVisibilityInput.is(':checkbox')) {
        const $toggleTargets = $($toggleVisibilityInput.data('toggle-visibility'));
        $toggleVisibilityInput.on('input', () => {
          $toggleTargets.toggle($toggleVisibilityInput.is(':checked'));

          if ($toggleVisibilityInput.attr('id') === 'ctrl-separate-frequencies') {
            updateTexture($baseFrequencyX, $outputDisplay);
          }
        });
        //Initialize
        $toggleTargets.toggle($toggleVisibilityInput.is(':checked'));
      } else if ($toggleVisibilityInput.is('select')) {
        const $allToggles = $toggleVisibilityInput.find(
          'option[data-toggle-visibility-and-enable]'
        );
        const allTargetsSelectorStr = $allToggles
          .toArray()
          .map((x) => {
            return $(x).data('toggle-visibility-and-enable');
          })
          .join(',');
        const $allTargets = $(allTargetsSelectorStr);

        $toggleVisibilityInput.on('input', () => {
          const selectedVal = $toggleVisibilityInput.val();
          const $currentTarget = $toggleVisibilityInput.find(`option[value=${selectedVal}]`);
          const $toggleTargets = $($currentTarget.data('toggle-visibility-and-enable'));

          $allTargets.hide().find('input, select').attr('disabled', 'disabled');
          const $enabledInputs = $toggleTargets.show().find('input, select').removeAttr('disabled'); //.trigger('input');
          $enabledInputs.each((_i, t) => updateTexture($(t), $outputDisplay));
        });
      }
    }

    //Form inputs
    if ($input.length) {
      $input.on('input', () => {
        updateTexture($input, $outputDisplay);
      });

      //Initialize
      $input.trigger('input');
    }
  });
});

function updateTexture($inputEl, $outputDisplay) {
  const isDisabled = $inputEl.is(':disabled');
  const suffix = $inputEl.data('target-filter-prop-suffix');
  const val = suffix ? $inputEl.val() + suffix : $inputEl.val();

  if ($outputDisplay.length) {
    $outputDisplay.text(isDisabled ? '' : val);
  }

  const tgtSelector = $inputEl.data('target');
  const tgtStyleProp = $inputEl.data('target-style-prop');
  const tgtFilterProp = $inputEl.data('target-filter-prop');
  const tgtAttr = $inputEl.data('target-attr');

  if (tgtSelector) {
    const $tgt = $(tgtSelector);

    if (!isDisabled && tgtStyleProp) {
      $tgt.css(tgtStyleProp, val);
      textureStyles[tgtStyleProp] = val;
    } else if (!isDisabled && tgtAttr) {
      if (
        $inputEl.attr('id') === $baseFrequencyX.attr('id') ||
        $inputEl.attr('id') === $baseFrequencyY.attr('id')
      ) {
        let combinedBaseFreq = $baseFrequencyX.val();
        if (!$baseFrequencyY.is(':disabled')) {
          combinedBaseFreq += ` ${$baseFrequencyY.val()}`;
        }
        $tgt.attr(tgtAttr, combinedBaseFreq);
      } else {
        $tgt.attr(tgtAttr, val);
      }
    } else if (tgtFilterProp) {
      updateTextureFilter($tgt, tgtFilterProp, val, isDisabled);
    }

    if ($inputEl.data('force-reload-svg')) {
      forceReloadSvg();
    }
  }
}
