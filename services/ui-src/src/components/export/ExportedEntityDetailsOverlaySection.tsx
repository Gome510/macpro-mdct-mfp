// components
import { ExportedSectionHeading } from "components";
import { Box } from "@chakra-ui/react";
// types
import {
  EntityShape,
  FormField,
  FormLayoutElement,
  ModalOverlayReportPageShape,
  ReportType,
} from "types";
// utils
import { useStore } from "utils";
import { assertExhaustive } from "utils/other/typing";
// verbiage
import wpVerbiage from "verbiage/pages/wp/wp-export";
import sarVerbiage from "verbiage/pages/sar/sar-export";

const exportVerbiageMap: { [key in ReportType]: any } = {
  WP: wpVerbiage,
  SAR: sarVerbiage,
};

export const ExportedEntityDetailsOverlaySection = ({
  section,
  ...props
}: ExportedEntityDetailsOverlaySectionProps) => {
  const { report } = useStore() ?? {};
  const entityType = section.entityType;

  return (
    <Box sx={sx.sectionHeading} {...props}>
      <ExportedSectionHeading
        heading={exportVerbiageMap[report?.reportType as ReportType]}
        reportType={report?.reportType}
        verbiage={{
          ...section.verbiage,
          intro: {
            ...section.verbiage.intro,
            info: undefined,
            exportSectionHeader: undefined,
            spreadsheet: "MLR Reporting",
          },
        }}
      />
      {renderEntityDetailTables(
        report?.reportType as ReportType,
        report?.fieldData[entityType] ?? [],
        section
      )}
    </Box>
  );
};

export interface ExportedEntityDetailsOverlaySectionProps {
  section: ModalOverlayReportPageShape;
}
/**
 * Split a list of form fields by the "sectionHeader" layout element type.
 * This allows returning distinct tables for each section, rather than one large one.
 *
 * In the returned FormField sections, the first element is the section header.
 *
 * @param formFields List of form fields, possibly containing section headers
 * @returns array of arrays containing form field elements representing a section
 */
export function getFormSections(
  formFields: (FormField | FormLayoutElement)[]
): (FormLayoutElement | FormField)[][] {
  const formSections: (FormLayoutElement | FormField)[][] = [];

  let currentSection: (FormField | FormLayoutElement)[] = [];
  for (let field of formFields) {
    if (field.type === "sectionHeader") {
      if (currentSection.length > 0) {
        formSections.push(currentSection);
      }
      currentSection = [field];
    } else {
      currentSection.push(field);
    }
  }
  formSections.push(currentSection);

  return formSections;
}

/**
 *
 * @param entities entities for entity type
 * @param section form json for section
 * @param formSections form fields broken down into sections
 * @param report report field data
 * @returns entity table and heading information for each section
 */

/**
 * Render entity detail table(s) conditionally based on report type.
 *
 * @param reportType report type of report
 * @param entities entities for entity type
 * @param section form json section
 * @param report report data
 * @returns array of exported entity table components
 */
export function renderEntityDetailTables(
  reportType: ReportType,
  entities: EntityShape[],
  section: ModalOverlayReportPageShape
) {
  switch (reportType) {
    case ReportType.WP: {
      const formSections = getFormSections(section.overlayForm?.fields ?? []);
      return `${JSON.stringify(entities)}.....${JSON.stringify(
        section
      )}.....${JSON.stringify(formSections)}.....`;
    }
    case ReportType.SAR:
      throw new Error(
        `The entity detail table for report type '${reportType}' have not been implemented.`
      );
    default:
      assertExhaustive(reportType);
      throw new Error(
        `The entity detail table for report type '${reportType}' have not been implemented.`
      );
  }
}

const sx = {
  root: {
    "@media print": {
      pageBreakInside: "avoid",
    },
    marginBottom: "1rem",
    width: "100%",
    "tr, th": {
      verticalAlign: "bottom",
      lineHeight: "base",
      borderBottom: "1px solid",
      borderColor: "palette.gray_lighter",
    },
    thead: {
      //this will prevent generating a new header whenever the table spills over in another page
      display: "table-row-group",
    },
    td: {
      p: {
        lineHeight: "1.25rem",
      },
      padding: "0.75rem 0.5rem",
      borderStyle: "none",
      fontWeight: "normal",
      color: "palette.base",
      ".shrink &": {
        padding: "0.375rem 0rem",
      },
      ".mobile &": {
        fontSize: "xs",
      },
      verticalAlign: "top",
    },
    th: {
      maxWidth: "100%",
      paddingBottom: "0.375rem",
      fontWeight: "bold",
      lineHeight: "lg",
      color: "palette.gray_medium",
      ".shrink &": {
        padding: "0.375rem 0rem",
      },
      "&:first-of-type": {
        paddingLeft: 0,
      },
    },
    ".desktop &": {
      "&.two-column": {
        "th:first-of-type": {
          paddingLeft: "6rem",
        },
      },
    },
  },
  tableIndex: {
    color: "palette.gray_medium",
    fontWeight: "bold",
  },
  statusIcon: {
    paddingLeft: "1rem",
    img: {
      maxWidth: "fit-content",
    },
  },
  emptyState: {
    margin: "0 auto",
    textAlign: "center",
    paddingBottom: "5rem",
  },
  entityInformation: {
    padding: "1rem 0 1rem 0",
    fontWeight: "bold",
  },
  entityHeading: {
    padding: "2rem 0 0.5rem 0",
    color: "palette.gray_medium",
    width: "100%",
    p: {
      color: "palette.base",
      "&:first-of-type": {
        marginTop: "1rem",
      },
    },
  },
  sectionHeading: {
    padding: "1.5rem 0 0 0",
  },
};