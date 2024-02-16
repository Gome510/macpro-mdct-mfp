export default {
  print: {
    printPageUrl: "/sar/export",
    printButtonText: "Review PDF",
    downloadButtonText: "Download PDF",
  },
  review: {
    intro: {
      header: "Review & Submit",
      infoHeader: "Ready to Submit?",
      info: [
        {
          type: "text",
          as: "span",
          content:
            "Double check that everything in your MFP SAR submission is accurate. You will be able to make edits after submitting if you contact your CMS MFP Project Officer to unlock your report while it is in “Submitted” status.",
        },
        {
          type: "text",
          as: "div",
          content:
            "<br><b>Compliance review</b><br>Your Project Officer will review your report and may contact you and unlock your report for editing if there are corrections to be made.",
        },
      ],
    },
    table: {
      headRow: ["Section", "Status", ""],
    },
    modal: {
      structure: {
        heading: "Are you sure you want to submit MFP SAR?",
        actionButtonText: "Submit SAR",
        closeButtonText: "Cancel",
      },
      body: "You won’t be able to make edits after submitting unless you send a request to CMS to unlock your submission. After review, a CMS MFP Project Officer will contact you if there are corrections to be made and your report status will change to “In revision” in the MFP SAR dashboard.",
    },
    pageLink: {
      text: "Submit SAR",
    },
    adminInfo: {
      header: "Admin Review",
      info: [
        {
          type: "text",
          as: "div",
          content:
            "<ul><li>To allow a state or territory to make corrections or edits to a submission use “Unlock” to release the submission, then email the state contact and inform them. The status will change to “In revision”.</li><br/></ul>",
        },
      ],
      modal: {
        unlockModal: {
          heading: "You unlocked this MFP SAR",
          actionButtonText: "Return to dashboard",
          body: "Email the state contact and let them know it requires edits.",
        },
      },
      unlockLink: {
        text: "Unlock",
      },
    },
  },
  submitted: {
    intro: {
      header: "Successfully Submitted",
      infoHeader: "Thank you",
      additionalInfoHeader: "What happens now?",
      additionalInfo: [
        {
          type: "text",
          as: "span",
          content:
            "Your dashboard will indicate the status of this SAR as “Submitted” and it is now locked from editing.",
        },
        {
          type: "text",
          as: "span",
          content:
            "<br><br/><b>Email your CMS MFP Project Officer to inform them you submitted the SAR and it is ready for their review.</b><br><br/>",
          props: {
            color: "palette.gray",
            fontWeight: "bold",
          },
        },
        {
          type: "ul",
          content: "",
          children: [
            {
              type: "li",
              children: [
                {
                  type: "html",
                  content:
                    "<span>If CMS has questions or requested corrections your Project Officer will contact you.</span>",
                },
              ],
            },
            {
              type: "li",
              children: [
                {
                  type: "html",
                  content:
                    "<span>If CMS determines corrections are not needed:",
                },
                {
                  type: "ul",
                  content: "",
                  children: [
                    {
                      type: "li",
                      children: [
                        {
                          type: "html",
                          content:
                            "<span>You can start updating your Work Plan for the next reporting period.</span>",
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  },
  alertBox: {
    title: "Your form is not ready for submission",
    description:
      "Some sections of the SAR submission have errors or are missing required responses. Ensure all required fields are completed with valid responses before submitting.",
  },
};
