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

## Leaderboard display controls

The website reads `Page - Leaderboard!A6:C12` through the Apps Script bootstrap response (`leaderboardSettings`). The leaderboard title and intro come from the same settings block.

- `show_category_breakdown`: show the five category averages.
- `show_vote_count`: show the number of votes.
- `show_only_closed_bakes`: show only bakes whose voting has closed.
- `show_total_score`: show the overall score out of 50.
- `show_bake_name`: show the bake name.

Set the optional display controls to `No` for a leaderboard showing only ranks and baker names. The home-page standings also respect bake-name, total-score and closed-voting controls. Scores still determine ranking when hidden. Missing display controls default to hidden.

After changing a Sheet setting, reload the website to fetch the latest values.

### Update an existing Apps Script deployment

Updating `google-apps-script/Code.gs` on GitHub does **not** update the live Google Apps Script web app.

1. In the linked Google Sheet, open **Extensions → Apps Script**.
2. Replace the existing `Code.gs` with the updated file from this repository and save.
3. Choose **Deploy → Manage deployments**.
4. Edit the existing web-app deployment, select **New version**, and deploy it. Keep the existing access settings.
5. Keep the same `/exec` URL in `docs/config.js`, then reload the website.

Until the backend is redeployed, the site safely shows only ranks and names because it has not received any display controls.
