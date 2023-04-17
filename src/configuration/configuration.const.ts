import {Configuration, TOP_LEVEL, TOP_REGIONS} from "./configuration.model";

export const configurationConst: Configuration = {
  tabtBaseApi: 'http://api.beping.be',
  top6: {
    clubsPerTop: {
      [TOP_REGIONS.HUY_WAREMME]: [
        'L029', 'L126', 'L193', 'L205', 'L230', 'L246', 'L257',
        'L266', 'L267', 'L275', 'L276', 'L282', 'L293', 'L295',
        'L333', 'L335', 'L358', 'L365', 'L374', 'L387', 'L393',
        'L398', 'L400', 'L310', 'L124', 'L234', 'L205',
      ],
      [TOP_REGIONS.LIEGE]: [
        'L030', 'L043', 'L098', 'L111', 'L119', 'L143',
        'L152', 'L165', 'L170', 'L185', 'L199', 'L217', 'L218',
        'L263', 'L312', 'L316', 'L338', 'L351', 'L355', 'L370',
        'L377', 'L383', 'L384', 'L390', 'L391', 'L396', 'L401',
      ],
      [TOP_REGIONS.VERVIERS]: [
        'L095', 'L323', 'L264', 'L002', 'L318', 'L320', 'L337', 'L348',
        'L313', 'L328', 'L125', 'L389', 'L382', 'L179', 'L360', 'L399',
        'L066', 'L368', 'L003', 'L184', 'L252', 'L272', 'L274', 'L284',
        'L296', 'L326', 'L329', 'L344', 'L349', 'L357', 'L378', 'L403',
      ],
    },
    divisionsByLevel: {
      [TOP_LEVEL.NAT_WB]: [6072, 6073, 6074, 6075, 6086, 6078, 6287, 6288, 6289, 6290, 6291],
      [TOP_LEVEL.P1]: [6428, 6430],
      [TOP_LEVEL.P2]: [6432, 6434, 6436, 6438],
      [TOP_LEVEL.P3]: [6440, 6442, 6444, 6446, 6448],
      [TOP_LEVEL.P4]: [6450, 6452, 6454, 6456, 6458, 6460],
      [TOP_LEVEL.P5]: [6462, 6464, 6466, 6468, 6470, 6472, 6474],
      [TOP_LEVEL.P6]: [6476, 6478, 6480, 6482, 6484, 6486, 6488, 6490, 6492, 6494],
    },
    pointsOverrides: {
      149585: [{
        weekName: 1,
        forfeit: 1,
      }],
      143759: [{
        weekName: 1,
        forfeit: 1
      }],
    },
  },
  email: {
    recipients: [
      'f.cardoen@me.com',
      'ttdolhain@hotmail.com',
      'brunosmets37@gmail.com',
      'thomasbastin5@gmail.com',
      'raphael.castillejos@hotmail.com',
    ],
    errorRecipients: [
      'f.cardoen@me.com',
    ],
    subject: 'Top 6 / Techniques (Verviers, Huy-Waremme, Liège)',
    text: 'Le nouveau classement TOP 6 de Verviers & Huy-Waremme vient d\'être calculé automatiquement par le serveur de BePing.<br/>Vous trouverez en pièces jointes de ce mail le classement du TOP6 ainsi que les techniques des rencontres dans la région de Verviers & Huy-Waremme de cette semaine. <br/>Si des erreurs étaient à constater, merci de répondre à ce mail.<br/><br/>',
  },
  output: 'output',
}
