const brochureData = {
    expression: [
        {
            lawName: "The Constitution of Nepal 2015",
            identifierType: "book",
            sections: [
                {
                    id: "Article 17",
                    title: "Opinion and Expression",
                    content: "The freedom of opinion and expression is guaranteed, but can be restricted if it undermines sovereignty, territorial integrity, nationality, independence, social harmony; defamation or contempt of court; or is contrary to public decency or morality."
                },
                {
                    id: "Article 19",
                    title: "Communication",
                    content: "Guarantees freedom of communication. Can be restricted on grounds of national security, sovereignty, public morals, or sedition."
                }
            ]
        },
        {
            lawName: "Electronic Transactions Act, 2008",
            identifierType: "book",
            sections: [
                {
                    id: "Section 47",
                    title: "Publication of Illegal Materials",
                    content: "Penalizes the publication of illegal materials in electronic form which violates public morality and decent behavior; spreads hate or jealousy; or affects social harmony."
                }
            ]
        },
        {
            lawName: "National Penal Code, 2017",
            identifierType: "book",
            sections: [
                {
                    id: "Section 300",
                    title: "Criminal Intimidation",
                    content: "Prohibits writing letters, pamphlets, documents or using electronic means to threaten, annoy, or tease another person with dishonest intention of causing fear, terror, pain, insult, or defamation."
                },
                {
                    id: "Section 306",
                    title: "Libel and Defamation",
                    content: "Prohibits committing libel—publishing imputations that damage personal or moral character, conduct, or reputation. \n\nExceptions: Truth, good faith, caution, and the benefit of the public."
                }
            ]
        }
    ],
    privacy: [
        {
            lawName: "The Constitution of Nepal 2015",
            identifierType: "book",
            sections: [
                {
                    id: "Article 28",
                    title: "Privacy",
                    content: "The privacy of any person, their document, data, and correspondence is inviolable except in accordance with law."
                }
            ]
        },
        {
            lawName: "Privacy Act, 2018",
            identifierType: "book",
            sections: [
                {
                    id: "Section 12",
                    title: "Privacy of Data",
                    content: "Personal data or details will be kept confidential unless needed for national security, peace, and order; or if required by a Court or authorized official during a criminal investigation."
                },
                {
                    id: "Section 13",
                    title: "Privacy of Correspondence",
                    content: "Correspondence, emails, or electronic conversations can be accessed by order of an authorized official in a criminal investigation."
                },
                {
                    id: "Section 14",
                    title: "Not to Open Letters",
                    content: "No person can open, view, or forward emails of another person; or open their personal letters unless an order has been issued by an authorized official during a criminal investigation."
                },
                {
                    id: "Section 19",
                    title: "Privacy of Electronic Means",
                    content: "Notice, information, correspondence, and conversations via electronic means can be listened to, marked, or recorded with an order of an authorized official."
                },
                {
                    id: "Section 26",
                    title: "Personal Information Without Consent",
                    content: "Personal information collected by public or corporate bodies can be shared without consent if demanded, in writing, by an authorized official in a criminal investigation or if the Court orders in sub-judice cases."
                },
                {
                    id: "Section 34",
                    title: "Not to Deem to Be a Bar",
                    content: "Authorities can obtain personal details from any person regarding investigation or prosecution of an offence."
                }
            ]
        },
        {
            lawName: "Electronic Transactions Act, 2008",
            identifierType: "book",
            sections: [
                {
                    id: "Section 28(1)",
                    title: "Controller to Have Access to Computers and Data",
                    content: "Controller can access devices and data if they suspect that provisions of the Act have been violated."
                },
                {
                    id: "Section 38(1)",
                    title: "To Deposit the Private Key to the Controller",
                    content: "Controller can access private keys if sovereignty or integrity of the country is threatened, or to maintain law."
                }
            ]
        },
        {
            lawName: "National Penal Code, 2017",
            identifierType: "book",
            sections: [
                {
                    id: "Section 293",
                    title: "Prohibition of Listening to or Recording Other's Conversation",
                    content: "No person can listen to or record conversation held between two or more persons without permission of the competent authority."
                },
                {
                    id: "Section 294",
                    title: "Prohibition of Divulging Confidential Matter",
                    content: "No person can divulge another person's confidential matter revealed in the course of professional work unless divulgence is compelled by law."
                },
                {
                    id: "Section 297",
                    title: "Prohibition of Opening Letters or Tapping Telephone Conversation",
                    content: "No person can open a person's letter or tap/record telephone conversations without permission of competent authority."
                },
                {
                    id: "Section 298",
                    title: "Prohibition of Breaching Privacy Through Electronic Means",
                    content: "No person can obtain information or correspondence done through electronic means or transfer information to another person in an unauthorized manner."
                }
            ]
        }
    ]
};



/* ===== Surveillance section ===== */
const surveillanceData = [
    {
        id: 'gov-cameras',
        side: 'left',
        tone: 'light',
        camera: true,
        text: "Governmental/public bodies can install smart surveillance cameras in public places to deter potential criminals through active surveillance."
    },
    {
        id: 'operators',
        side: 'left',
        tone: 'muted',
        camera: true,
        emphasis: "obliged to provide footage",
        text: "CCTV operators are obliged to provide footage immediately to police or government authorities upon demand for investigations."
    },
    {
        id: 'police-units',
        side: 'left',
        tone: 'light',
        camera: true,
        text: "Police Units must compile local CCTV data and submit reports to the District Police Office and DAO."
    },
    {
        id: 'mandatory',
        side: 'right',
        tone: 'dark',
        camera: true,
        emphasis: "Mandatory",
        text: "Mandatory to install CCTV in businesses, companies or commercial premises."
    },
    {
        id: 'dao-inspections',
        side: 'right',
        tone: 'dark',
        camera: true,
        text: "The DAO may send police team to conduct scheduled or emergency inspections to verify compliance."
    },
    {
        id: 'walk-past',
        side: 'right',
        tone: 'accent',
        italic: true,
        camera: true,
        text: "It is easy to walk past public CCTV cameras and assume they are strictly there for safety or to think the government has no real access to privately installed CCTV."
    },
    {
        id: 'in-reality',
        side: 'left',
        tone: 'accent',
        italic: true,
        camera: false,
        text: "But in reality, privately and commercially operated CCTV systems are obligated to turn recordings over to the police upon demand. CCTV, instead of keeping people safe, can be used to surveil and suppress dissent if the government perceives public actions and expressions as a threat. For activists, marginalized groups and state critics, this risk is a daily reality."
    }
];