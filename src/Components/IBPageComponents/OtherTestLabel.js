import React from "react";
import { v4 as uuidv4 } from "uuid";
import { Dropdown, Badge } from "react-bootstrap";
import { config } from "../../config";

const { urls } = config;

const OtherRelvalsLabel = ({ otherTests, type_name, title }) => {
  if (!otherTests || Object.keys(otherTests).length === 0) return null;

  const anyFailure = Object.values(otherTests).some(
    t => t.details && t.details.num_failed > 0
  );

  return (
    <>
      <Dropdown key={uuidv4()} size="sm">
        <Dropdown.Toggle
          variant={anyFailure ? "danger" : "secondary"}
          id={`${type_name}-test-toggle`}
        >
          <span style={{ color: "#fff" }}>{title} Relvals</span>
        </Dropdown.Toggle>

        <Dropdown.Menu className="super-colors">
          {Object.entries(otherTests).map(([key, item]) => {
            let num = 0;
            let done = "*";
            let state = "failed";
            let variant = "danger";

            if (item.done) done = "";

            if (item.details) {
              num = Number(item.details.num_failed) || 0;
              if (num === 0) {
                state = "passed";
                variant = "success";
                num = Number(item.details.num_passed) || 0;
              }
            }

            const match = item.release_name.match(
              /^(CMSSW_\d+_\d+)_((.+_|)X)_(.*)$/
            );

            if (!match) return null;

            const url = urls.newRelValsSpecific(
              match[1],
              match[4],
              match[2],
              item.arch,
              `&selectedOthers=${item.other}&selectedStatus=${state}`
            );

            return (
              <Dropdown.Item key={uuidv4()} href={url}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <b>{key}</b>
                  <Badge bg={variant}>
                    {num}
                    {done}
                  </Badge>
                </div>
              </Dropdown.Item>
            );
          })}
        </Dropdown.Menu>
      </Dropdown>
      <span>&nbsp;&nbsp;</span>
    </>
  );
};

export { OtherRelvalsLabel };
