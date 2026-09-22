# Connect the Google Sheet

The website is already configured for this spreadsheet:

**Great Salford Bake Off - Website Control**
Spreadsheet ID: `1lrjX2txvdZQ7B20yfXy55c7FD6QpBETnws_3TE9FUIs`

## 1. Add the Apps Script backend

Open the Google Sheet, then go to **Extensions → Apps Script**.

Delete any placeholder code in `Code.gs`, then paste in the contents of:

`google-apps-script/Code.gs`

Save the project. You can call it **Great Salford Bake Off API**.

## 2. Deploy it as a web app

In Apps Script:

1. Click **Deploy → New deployment**.
2. Click the cog beside **Select type** and choose **Web app**.
3. Description: `Great Salford Bake Off website API`.
4. **Execute as:** Me.
5. **Who has access:** Anyone.
6. Click **Deploy**.
7. Google may ask you to authorise the script to access the spreadsheet. Approve it.
8. Copy the **Web app URL** ending in `/exec`.

## 3. Put the URL into the website

Open `docs/config.js` and change it to:

```js
window.GSBO_CONFIG = {
  API_URL: "PASTE-YOUR-WEB-APP-URL-HERE",
  DEMO_MODE: false
};
```

Save the file and push the change to GitHub.

## 4. Test it

Open the website. The sign-in dropdown should now contain the unique names entered in:

`Page - Contestants → Assigned person 1 / Assigned person 2`

Open voting for a bake by adding its details in `Page - Bakes` and changing **Voting open?** to `Yes`.

The signed-in baker will see their own bake as locked. Other people can vote. Each successful vote is appended to `Data - Votes`, and the formulas on `Page - Leaderboard` calculate the averages automatically.

## Security / voting behaviour

The visible website prevents voting for your own bake, but the Apps Script checks this again before writing to the Sheet. It also rejects duplicate votes from the same signed-in name for the same Bake ID.

This is deliberately a lightweight office sign-in rather than secure authentication: people select their own name from a dropdown, so it relies on colleagues choosing themselves honestly.
