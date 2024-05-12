let form = document.getElementById('join-form');
form.addEventListener('submit', (e) => {
    e.preventDefault();
    let inviteCode = e.target.invite_link.value;
    window.location = `index.html?room=${inviteCode}`;
});

let uidLink = generateUUID();
let inviteLinkInput = document.getElementById('invite-link');
inviteLinkInput.value = uidLink;

inviteLinkInput.addEventListener('click', () => {
    let meetingLink = `127.0.0.1:5500/index.html?room=${uidLink}`;
    navigator.clipboard.writeText(meetingLink).then(() => {
        console.log('Meeting link is copied to clipboard');
    }).catch((err) => {
        console.log(err);
    });
})