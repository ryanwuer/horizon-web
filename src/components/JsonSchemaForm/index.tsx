import 'bootstrap/dist/css/bootstrap.css';
import './index.less';
import Form from '@rjsf/bootstrap-4';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import validator from '@rjsf/validator-ajv8';
import { WidgetProps } from '@rjsf/utils';

interface FormProps {
  disabled: boolean,
  jsonSchema: any,
  uiSchema: any;

  formData?: any;

  onChange?: any;

  onSubmit?: any;

  liveValidate?: boolean;

  showErrorList?: boolean;
}

// 自定义 Range Widget，使用 Bootstrap 的 range input
const RangeWidget = (props: WidgetProps) => {
  const {
    value,
    onChange,
    disabled,
    readonly,
    schema,
    options,
  } = props;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = schema.type === 'integer'
      ? parseInt(event.target.value, 10)
      : parseFloat(event.target.value);
    onChange(newValue);
  };

  const min = schema.minimum ?? options?.minimum ?? 0;
  const max = schema.maximum ?? options?.maximum ?? 100;
  const step = schema.multipleOf ?? options?.step ?? (schema.type === 'integer' ? 1 : 0.1);

  return (
    <div>
      <input
        type="range"
        className="form-control-range"
        value={value ?? min}
        onChange={handleChange}
        disabled={disabled || readonly}
        min={min}
        max={max}
        step={step}
      />
      {options?.showValue !== false && (
        <div className="mt-2">
          <span>{value ?? min}</span>
        </div>
      )}
    </div>
  );
};

export default forwardRef((props: FormProps, ref) => {
  const formRef = useRef();

  // 注册自定义 widgets
  const widgets = {
    range: RangeWidget,
  };

  useImperativeHandle(
    ref,
    () => ({
      submit: () => {
        (formRef.current as any).formElement.current.dispatchEvent(
          new CustomEvent('submit', {
            cancelable: true,
            bubbles: true, // <-- actual fix
          }),
        );
      },
    }),
  );
  return (
    // @ts-ignore
    <div>
      <Form
        validator={validator}
        ref={formRef}
        disabled={props.disabled}
        formData={props.formData}
        schema={props.jsonSchema}
        uiSchema={props.uiSchema}
        onChange={props.onChange}
        onSubmit={props.onSubmit}
        liveValidate={props.liveValidate}
        showErrorList={props.showErrorList && 'bottom'}
        omitExtraData
        widgets={widgets}
      >
        <div />
      </Form>
    </div>
  );
});
