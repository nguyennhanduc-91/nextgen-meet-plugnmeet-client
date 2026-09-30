import React from 'react';
import { Field, Label, Switch } from '@headlessui/react';
import clsx from 'clsx';

interface ISettingsSwitchProps {
  label: string;
  icon?: React.ReactNode;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
  customCss?: string;
}

const SettingsSwitch = ({
  label,
  icon,
  enabled,
  onChange,
  disabled,
  customCss,
}: ISettingsSwitchProps) => {
  return (
    <Field
      as="div"
      className={clsx('flex items-center justify-between', customCss)}
    >
      <div className={`flex items-center gap-3 w-full pr-4 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        {icon && <div className="text-Gray-500 dark:text-Gray-400 flex-shrink-0 flex items-center justify-center w-5 h-5 [&>svg]:w-full [&>svg]:h-full">{icon}</div>}
        <Label
          className="text-sm font-medium text-Gray-950 ltr:text-left rtl:text-right dark:text-white cursor-pointer"
        >
          {label}
        </Label>
      </div>
      <Switch
        disabled={disabled}
        checked={enabled}
        onChange={onChange}
        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-hidden focus:ring-2 focus:ring-offset-2 cursor-pointer ${
          enabled ? 'bg-Blue2-500' : 'bg-Gray-200'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span
          className={`${
            enabled
              ? 'ltr:translate-x-4.5 rtl:-translate-x-4.5'
              : 'ltr:translate-x-1 rtl:-translate-x-0.5'
          } ${disabled ? 'cursor-not-allowed' : ''} inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
        />
      </Switch>
    </Field>
  );
};

export default SettingsSwitch;
