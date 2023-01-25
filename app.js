// Require the Bolt package (github.com/slackapi/bolt)
const { App } = require("@slack/bolt");

const { Octokit } = require("octokit");

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});

const octokit = new Octokit({
  auth: process.env.GITHUB_ACCESS_TOKEN,
});

(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);

  console.log("⚡️ Bolt app is running!");
  
})();

app.command("/bob", async ({ command, ack, say }) => {
  // Acknowledge command request

  try {
    await ack();
    if (command.text == "clear") {
      await say(
        `*_${command.user_name} issued \`/bob clear\`. I'll leave for now. But Ill be back..._*`
      );

      await new Promise(res => setTimeout(res, 5000));
      
      //console.log(`BOT IS USER <@${process.env.SLACK_BOT_USER_ID}>`);
    
      // Call the conversations.history method using the built-in WebClient
      const result = await app.client.conversations.history({
        // The token you used to initialize your app
        token: process.env.SLACK_BOT_TOKEN,
        channel: command.channel_id,
        limit: 50,
      });

      const messages = result.messages;

      for (let i = 0; i < messages.length; i++) {
        if (messages[i].files) {
          continue;
        }

        //console.log(messages[i].text);
        
        // Checks mentions... messages[i].text.startsWith(`<@${process.env.SLACK_BOT_USER_ID}>`)
        // This bot does not have permissions so not including this for now.
        if (messages[i].bot_id == process.env.SLACK_BOT_ID) {
          // Call the chat.delete method

          console.log(`Deleting message with text ${messages[i].text}`);
          const result = await app.client.chat.delete({
            channel: command.channel_id,
            ts: messages[i].ts,
          });
        }
      }
    }
    else
    {
      await say(optionsMenu());
    }
  } catch (error) {
    console.error(error);
  }
});

// subscribe to 'app_mention' event in your App config
// need app_mentions:read and chat:write scopes
app.event("app_mention", async ({ event, context, client, say }) => {
  console.log("App mention called");
  try {
    await say(optionsMenu());
  } catch (error) {
    console.error(error);
  }
});

function optionsMenu()
{
  return({
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*_What do you want human..._*",
          },
        },
        {
          type: "divider",
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: " *_Make an internal release candidate?_*",
          },
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              action_id: "build_win_rc",
              text: {
                type: "plain_text",
                text: ":window: RC Build",
                emoji: true,
              },
              value: "build_win_rc",
            },
            {
              type: "button",
              action_id: "build_osx_rc",
              text: {
                type: "plain_text",
                text: ":apple: RC Build",
                emoji: true,
              },
              value: "build_osx_rc",
            },
          ],
        },
        {
          type: "divider",
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: " *_Release the last build to the public?_*",
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: ":hellmo: *NO TURNING BACK* :hellmo:",
          },
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              action_id: "release_win",
              text: {
                type: "plain_text",
                text: ":window: Promote",
                emoji: true,
              },
              value: "release_win",
            },
            {
              type: "button",
              action_id: "release_osx",
              text: {
                type: "plain_text",
                text: ":apple: Promote",
                emoji: true,
              },
              value: "release_osx",
            },
          ],
        },
      ],
    });
}

app.action("empty_ack", async ({ ack }) => {
  console.log("somebody clicked a link");
  try {
    await ack();
  } catch (error) {
    console.error(error);
  }
});

app.action("build_osx_rc", async ({ ack, say }) => {
  console.log("build osx rc called");
  try {
    await octokit.request(
      "POST /repos/RenderHeads/proj-202202-metavoidal/actions/workflows/BuildCertAndPublishRC_OSX.yml/dispatches",
      {
        ref: "main",
      }
    );
    await ack();
    await say({
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*_ :apple: build underway... _*",
          },
          accessory: {
            type: "button",
            text: {
              type: "plain_text",
              text: "Track on GitHub :octocat:",
              emoji: true,
            },
            value: "link_to_build",
            url: "https://github.com/RenderHeads/proj-202202-metavoidal/actions/workflows/BuildCertAndPublishRC_OSX.yml",
            action_id: "empty_ack",
          },
        },
      ],
    });
  } catch (error) {
    console.error(error);
  }
});

app.action("build_win_rc", async ({ ack, say }) => {
  console.log("build win rc called");
  try {
    await octokit.request(
      "POST /repos/RenderHeads/proj-202202-metavoidal/actions/workflows/BuildCertAndPublishRC_Windows.yml/dispatches",
      {
        ref: "main",
      }
    );
    await ack();
    await say({
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*_ :window: build underway... _*",
          },
          accessory: {
            type: "button",
            text: {
              type: "plain_text",
              text: "Track on GitHub :octocat:",
              emoji: true,
            },
            value: "link_to_build",
            url: "https://github.com/RenderHeads/proj-202202-metavoidal/actions/workflows/BuildCertAndPublishRC_Windows.yml",
            action_id: "empty_ack",
          },
        },
      ],
    });
  } catch (error) {
    console.error(error);
  }
});

app.action("release_osx", async ({ ack, say }) => {
  console.log("release osx called");
  try {
    await octokit.request(
      "POST /repos/RenderHeads/proj-202202-metavoidal/actions/workflows/PromoteRCToPublic_OSX.yml/dispatches",
      {
        ref: "main",
      }
    );
    await ack();
    await say({
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*_ IVE NEVER TASTED APPLES. IVE NEVER TASTED ANYTHING_*",
          },
          accessory: {
            type: "button",
            text: {
              type: "plain_text",
              text: "Track on GitHub :octocat:",
              emoji: true,
            },
            value: "link_to_build",
            url: "https://github.com/RenderHeads/proj-202202-metavoidal/actions/workflows/PromoteRCToPublic_OSX.yml",
            action_id: "empty_ack",
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*:apple: Build Released.* I cooked up this fine specimine just for you. No, no. I dont want thanks. :hugging_face: Your expression is all the thanks I need. \n\n _You may want to double check that this action actually completed :fire: _",
          },
          accessory: {
            type: "image",
            image_url: "https://media.tenor.com/_p9juVi1Ul8AAAAM/cat-apple.gif",
            alt_text: "hellmoo",
          },
        },
      ],
    });
  } catch (error) {
    console.error(error);
  }
});

app.action("release_win", async ({ ack, say }) => {
  console.log("release win called");
  try {
    await ack();
    await octokit.request(
      "POST /repos/RenderHeads/proj-202202-metavoidal/actions/workflows/PromoteRCToPublic_Windows.yml/dispatches",
      {
        ref: "main",
      }
    );
    await say({
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*_ IS IT HOME TIME YET?_*",
          },
          accessory: {
            type: "button",
            text: {
              type: "plain_text",
              text: "Track on GitHub :octocat:",
              emoji: true,
            },
            value: "link_to_build",
            url: "https://github.com/RenderHeads/proj-202202-metavoidal/actions/workflows/PromoteRCToPublic_Windows.yml",
            action_id: "empty_ack",
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*:window: Build Released!* You did it... Well... actually _I did it._ Bob the omnipotent. Work harder humans!\n\n _You may want to double check that this action has completed :fire: _",
          },
          accessory: {
            type: "image",
            image_url:
              "https://media.tenor.com/P63DgPMZ8-sAAAAS/party-hellmo.gif",
            alt_text: "hellmoo",
          },
        },
      ],
    });
  } catch (error) {
    console.error(error);
  }
});
