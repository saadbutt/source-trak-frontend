import React, { useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';

// Labelled input with a leading Feather icon — web version of the mobile <Field />.
// `id` doubles as the input name. `reveal` adds a show/hide toggle for passwords.
const IconField = ({ id, label, icon: Icon, type = 'text', reveal = false, helper, ...inputProps }) => {
  const [shown, setShown] = useState(false);
  const inputType = reveal ? (shown ? 'text' : 'password') : type;

  return (
    <div className="form-group">
      <label htmlFor={id} className="form-label">{label}</label>
      <div className={`input-icon ${reveal ? 'has-trail' : ''}`}>
        {Icon && <Icon className="input-icon-lead" aria-hidden="true" />}
        <input id={id} name={id} type={inputType} className="form-input" {...inputProps} />
        {reveal && (
          <button
            type="button"
            className="input-icon-trail"
            onClick={() => setShown((v) => !v)}
            aria-label={shown ? 'Hide password' : 'Show password'}
          >
            {shown ? <FiEyeOff /> : <FiEye />}
          </button>
        )}
      </div>
      {helper && <p className="form-helper">{helper}</p>}
    </div>
  );
};

export default IconField;
