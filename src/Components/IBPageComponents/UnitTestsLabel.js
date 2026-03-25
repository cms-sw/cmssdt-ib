import React, { useMemo, useState } from 'react';
import { SiNvidia, SiAmd } from "react-icons/si";
import PropTypes from 'prop-types';
import { Dropdown, Form } from 'react-bootstrap';
import { config } from '../../config';
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaExclamationCircle,
  FaMicrochip,
  FaDatabase,
  FaSearch
} from 'react-icons/fa';

const { urls } = config;
const MAX_VISIBLE = 10;

const COLOR_SCHEME = {
  success: { bg: '#198754', text: '#ffffff', border: '#146c43' },
  danger: { bg: '#dc3545', text: '#ffffff', border: '#b02a37' },
  secondary: { bg: '#6c757d', text: '#ffffff', border: '#565e64' },
  warning: { bg: '#ffc107', text: '#000000', border: '#cc9a06' }
};

const getBuildOrUnitUrl = ({ file, arch, ibName, urlParameter = '' }) => {
  if (!file) return undefined;

  if (file === 'not-ready') {
    return `${urls.scramDetailUrl}${arch};${ibName}`;
  }

  let linkParts = file.split('/');
  linkParts = linkParts.slice(4, 9);

  return `${urls.buildOrUnitTestUrl}${linkParts.join('/')}${urlParameter}`;
};

const getStatusIcon = (variant) => {
  switch (variant) {
    case 'success':
      return <FaCheckCircle className="me-1" />;
    case 'danger':
      return <FaExclamationCircle className="me-1" />;
    case 'warning':
      return <FaExclamationTriangle className="me-1" />;
    default:
      return null;
  }
};
//helper for nvidia and AMD icons
const getVendorIcon = (name = "") => {
  const lower = name.toLowerCase();

  if (lower.includes("nvidia")) {
    return (
      <SiNvidia
        className="me-2"
        style={{ color: "#76b900", fontSize: "1.1rem" }}
      />
    );
  }

  if (lower.includes("amd")) {
    return (
      <SiAmd
        className="me-2"
        style={{
          color: "#ed1c24",
          fontSize: "1.2rem",   
          transform: "scale(1.2)", 
          display: "inline-block"
        }}
      />
    );
  }

  return null;
};
const UnitTestsLabel = ({ tests = {}, type_name }) => {
  const [search, setSearch] = useState('');

  if (!tests || Object.keys(tests).length === 0) return null;

  const anyFailure = Object.values(tests).some(
    (t) => Number(t.details?.num_fails) > 0
  );

  const configMap = {
    gpu: {
      title: 'GPU Test',
      icon: <FaMicrochip className="me-1" />,
      param: 'gpu',
      field: 'gpu'
    },
    rntuple: {
      title: 'RNTuple Test',
      icon: <FaDatabase className="me-1" />,
      param: 'other',
      field: 'other'
    }
  };

  const current = configMap[type_name];

  const toggleStyle = {
    backgroundColor: anyFailure
      ? COLOR_SCHEME.danger.bg
      : COLOR_SCHEME.success.bg,
    borderColor: anyFailure
      ? COLOR_SCHEME.danger.border
      : COLOR_SCHEME.success.border,
    color: anyFailure
      ? COLOR_SCHEME.danger.text
      : COLOR_SCHEME.success.text,
    fontWeight: '500',
    padding: '6px 12px',
    fontSize: '0.9rem',
    borderRadius: '6px',
    display: 'inline-flex',
    alignItems: 'center',
    border: '1px solid',
    transition: 'all 0.2s ease'
  };

  const filteredTests = useMemo(() => {
    const entries = Object.entries(tests).filter(([key]) =>
      key.toLowerCase().includes(search.toLowerCase())
    );

    const failed = entries.filter(([, item]) => {
      const numFails = Number(item.details?.num_fails ?? 0);
      return numFails > 0;
    });

    const passed = entries.filter(([, item]) => {
      const numFails = Number(item.details?.num_fails ?? 0);
      return numFails === 0;
    });

    return {
      failed: failed.slice(0, MAX_VISIBLE),
      passed: passed.slice(0, MAX_VISIBLE)
    };
  }, [tests, search]);

  const renderTestItem = ([key, item]) => {
    const failed = Number(item.details?.num_fails ?? 0);
    const passed = Number(item.details?.num_passed ?? 0);
    const total = Number(item.details?.num_total ?? 0);

    const variant = failed > 0 ? 'danger' : 'success';
    const colors = COLOR_SCHEME[variant] || COLOR_SCHEME.secondary;

    const selectedItem = item[current.field];

    const url = getBuildOrUnitUrl({
      file: item.file,
      arch: item.arch,
      ibName: item.release_name,
      urlParameter: `?utests/${current.param}/${selectedItem}`
    });

    return (
      <Dropdown.Item
        key={key}
        href={url}
        style={{
          padding: '10px 16px',
          borderBottom: '1px solid #e9ecef'
        }}
      >
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            {getVendorIcon(key) || current.icon}
            <span className="fw-bold ms-1">{key}</span>
          </div>

          <div
            className="d-inline-flex align-items-center px-2 py-1 rounded"
            style={{
              backgroundColor: colors.bg,
              color: colors.text,
              fontSize: '0.85rem',
              fontWeight: '500',
              minWidth: '40px',
              justifyContent: 'center'
            }}
          >
            {getStatusIcon(variant)}
            {/* <span className="ms-1">{failed > 0 ? failed : passed}</span> */}
          </div>
        </div>

        {/* <div className="small text-muted mt-1">
          Total: {total} | Passed: {passed} | Failed: {failed}
        </div> */}
      </Dropdown.Item>
    );
  };

  const totalVisible =
    filteredTests.failed.length + filteredTests.passed.length;

  return (
    <Dropdown className="d-inline-block me-2" autoClose="outside">
      <Dropdown.Toggle
        id={`${type_name}-unit-tests-toggle`}
        style={toggleStyle}
        title={anyFailure ? 'Has failures' : 'All tests passed'}
      >
        {current.icon}
        <span className="mx-1">{current.title}</span>
        {anyFailure ? (
          <FaExclamationTriangle className="ms-1" />
        ) : (
          <FaCheckCircle className="ms-1" />
        )}
      </Dropdown.Toggle>

      <Dropdown.Menu
        style={{
          minWidth: '340px',
          maxHeight: '420px',
          padding: '8px 0',
          overflowY: 'auto'
        }}
      >
        <Form className="px-2 mb-2">
          <div className="d-flex align-items-center border rounded px-2">
            <FaSearch className="text-muted me-2" />
            <Form.Control
              size="sm"
              placeholder="Search tests..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-0 shadow-none"
            />
          </div>
        </Form>

        {filteredTests.failed.length > 0 && (
          <>
            <div
              className="px-3 py-2 fw-bold"
              style={{
                fontSize: '0.8rem',
                color: COLOR_SCHEME.danger.bg,
                background: '#f8d7da',
                borderTop: '1px solid #e9ecef',
                borderBottom: '1px solid #e9ecef'
              }}
            >
              Failed Tests ({filteredTests.failed.length})
            </div>
            {filteredTests.failed.map(renderTestItem)}
          </>
        )}

        {filteredTests.passed.length > 0 && (
          <>
            <div
              className="px-3 py-2 fw-bold"
              style={{
                fontSize: '0.8rem',
                color: COLOR_SCHEME.success.bg,
                background: '#d1e7dd',
                borderTop: '1px solid #e9ecef',
                borderBottom: '1px solid #e9ecef'
              }}
            >
              Passed Tests ({filteredTests.passed.length})
            </div>
            {filteredTests.passed.map(renderTestItem)}
          </>
        )}

        {totalVisible === 0 && (
          <Dropdown.Item disabled className="text-center text-muted py-2">
            No matching tests
          </Dropdown.Item>
        )}
      </Dropdown.Menu>
    </Dropdown>
  );
};

UnitTestsLabel.propTypes = {
  tests: PropTypes.object,
  type_name: PropTypes.oneOf(['gpu', 'rntuple']).isRequired
};

// UnitTestsLabel.defaultProps = {
//   tests: {}
// };

export { UnitTestsLabel };
