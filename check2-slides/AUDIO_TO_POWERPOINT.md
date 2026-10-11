# Putting your sound recordings into the PowerPoint (separate step)

The approved deck (`Reading_Foundations_Check_2_Royal_Purple_44_Sounds_Audio_Ready.pptx`) is **never changed** by the
Recording Studio. Its small speaker icons are placeholders. The web slideshow plays your recordings when you click
the speaker icon; the PowerPoint does not contain any audio until you add it yourself.

## 1. Export your recordings
Teacher Dashboard > What to Teach Next > Check 2 > Teacher Sound Recording Studio > **Export All Sound Recordings**.
The ZIP has `manifest.json` (which sound goes with which file and slide), `README.txt`, and an `audio/` folder with
files named like `c2_sound_01_b.webm`.

## 2. Convert the audio (WebM does not play in every PowerPoint)
Chrome and Edge record WebM/Opus. PowerPoint plays M4A (AAC) or MP3 reliably. With ffmpeg installed:

    # one file
    ffmpeg -i c2_sound_01_b.webm -c:a aac -b:a 128k c2_sound_01_b.m4a

    # every file in the folder (macOS/Linux)
    for f in audio/*.webm; do ffmpeg -y -i "$f" -c:a aac -b:a 128k "${f%.webm}.m4a"; done

    # every file in the folder (Windows PowerShell)
    Get-ChildItem audio\*.webm | ForEach-Object { ffmpeg -y -i $_.FullName -c:a aac -b:a 128k ($_.FullName -replace '\.webm$','.m4a') }

(The conversion command above was tested on a real recording from the studio.)

## 3. Add the audio in PowerPoint
1. Open a **copy** of the approved deck (keep the original untouched).
2. Go to the sound's slide (slide number = sound number + 1; `manifest.json` lists it).
3. Insert > Audio > Audio on My PC, choose the matching `.m4a` file.
4. In Playback, set Start to **On Click** and choose "Hide During Show" if you do not want PowerPoint's own audio icon.
5. Place the audio over the deck's small speaker icon, or keep the deck's icon and attach the audio to it.
6. Do not move or delete the PREVIOUS / SOUND MENU / NEXT buttons; they hold the deck's slide links.

Nothing in the app writes audio into a PowerPoint. A ready-made audio-enabled PowerPoint has **not** been created or tested.
