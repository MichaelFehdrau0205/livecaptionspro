[Live Captions Pro] PRD

Project: Live Captions
Owner: Luba Kaper and Michael Fehdrau
Date: Sunday, March 08, 2026

Problem
Live Captions exist — but they fail people at the worst moments. Words get dropped, technical terms get mangled, and there is no way to recover what was missed. For Deaf and hard of hearing users, this is not just frustrating — it means exclusion from critical conversations in healthcare, education, legal settings, and the workplace. 

Current solutions from Google, Microsoft, and Apple all share the same core flaw: they show you what the AI heard — not what was actually said.


Supporting Context (Data Points & Research)
About 48 million Americans — roughly 15% of the adult population — report some degree of hearing loss, and approximately 2 million people in the United States are considered functionally Deaf. Hearview
More than 90% of Deaf children are born to hearing parents NIDCD — meaning most Deaf individuals grow up navigating a hearing world without built-in support systems.
Deaf and hard of hearing individuals face significant obstacles in accessing education and employment opportunities, and Deaf children in the U.S. are less likely to graduate from high school than their hearing peers. The Treetop ABA
Even the most advanced automated speech recognition systems struggle with accents, technical jargon, poor audio quality, and overlapping speakers — often achieving accuracies only between 80–90%. 24marketreports
Around 65% of businesses now adopt live captioning to improve communication Global Growth Insights — yet none of the dominant tools are built specifically for high-stakes Deaf users.
Google, Apple, and Microsoft all offer general-purpose captioning — but none own a specific vertical like healthcare, legal, or education where zero lost meaning is a necessity, not a preference.


The Opportunity
Live captioning technology exists — but no one has built it for a specific high-stakes environment. Google, Apple, and Microsoft all offer general-purpose solutions that prioritize accuracy scores over actual comprehension. The opportunity is to build the first captioning product designed around zero lost meaning — owning a vertical like healthcare, legal, or education where getting every word right isn't a nice-to-have, it's a necessity.


Market Opportunity
The global live captioning software market reached USD 1.42 billion in 2024 and is projected to grow at a CAGR of 13.1% from 2025 to 2033, reaching an estimated value of USD 4.10 billion. Growthmarketreports
North America accounts for approximately 41% of global revenue — driven by federal accessibility laws such as the ADA and Section 508, which mandate real-time captioning for public communications. Growthmarketreports
By 2050, it is estimated that over 900 million people — or one in every ten individuals — will have disabling hearing loss globally. Total Care ABA
No single player currently owns the high-stakes vertical captioning space — healthcare, legal, and education all represent underserved markets where accuracy is legally and medically required.
FullCaption's opportunity is to capture the vertical-specific segment of this growing market by being the first product built around zero lost meaning — not just higher accuracy scores.


Users & Needs
Who: 
Primary Users: Deaf and hard of hearing individuals — including college students, professionals, and everyday users who rely on captions to access conversations in real time.
Secondary Users: Hearing individuals who speak into the microphone — doctors, professors, lawyers, colleagues — whose speech is being transcribed for the primary user.


Needs: be as detailed as possible here!
Primary User — Deaf User
As a Deaf college student, I need to capture every word spoken in a fast-paced lecture because missing even one critical concept can affect my understanding, my grades, and my ability to keep up with my peers.
As a Deaf employee, I need real-time captions during live meetings in order to contribute to discussions, stay informed, and be treated as an equal member of my team.
Secondary User — Hearing Speaker
As a professor lecturing to a Deaf student, I need my speech to be transcribed clearly and completely in order to deliver an equal learning experience without changing the way I teach."
As a manager running a team meeting, I need my words and my colleagues' responses to be accurately captioned in real time in order to ensure my Deaf employee has full access to every decision, discussion, and direction being communicated."


Proposed Solution
Live Captions is a live captioning platform that combines real-time speech-to-text with an AI layer that fills gaps, flags uncertainty, and delivers the full meaning of every conversation.


Top 3 MVP Value props:
[The Vitamin] - Seeing every word fully and completely so the brain can process the message without any gaps. When there's a gap, the mind gets lost and the meaning breaks down.
[The Painkiller] - The pain of dropped words and long silences — waiting for the next word to appear, losing the thread of the conversation because the soundwave didn't reach the microphone clearly enough.
[The Steroid] - A supercharged audio layer that captures soundwaves more powerfully and delivers them straight to live captions within one second — no delay, no drop, no gap.


Goals & Non-Goals
Goals:
Deliver real-time live captions with zero lost meaning for Deaf and hard of hearing users
Build a purpose-built captioning product for one high-stakes vertical — healthcare, legal, education, or workplace
Achieve 97%+ caption accuracy that outperforms Google, Apple, and Microsoft
Give users confidence in every caption through Gap Filler and Confidence Highlighting
Ensure no word, meaning, or moment is lost between what was said and what was understood
Non-Goals:
We are NOT building a general-purpose captioning tool for everyone — this is vertical-specific
We are NOT building hardware in this version — FullCaption is a software-first product
We are NOT supporting every language in the MVP — English first, expansion later
We are NOT building a full transcription storage or document export system in v1
We are NOT replacing ASL interpreters — FullCaption is a complement, not a substitute
We are NOT targeting hearing users as the primary audience in this version
Success Metrics

Goal                            Signal                          Metric                      Target
Accuracy                        Captions capture every          Caption accuracy rate        97%+
                                word correctly

Gap Filler Performance          AI correctly predicts           Gap Filler success rate      90%+
                                missed words

Speed                           Captions appear immediately     Caption latency              Under 1 second
                                after speech

User Trust                      Users trust what they see       3-Second Replay              Low - under 15% 
                                without replaying               usage rate                   of sessions

Engagement                      Users return to FullCaption     Weekly active users          X WAU
                                regularly

Session Quality                 Users stay through              Average session length       more than 
                                full conversations                                           10 minutes

Comprehension                   Users understood the full       Post-session survey score    85%+ positive
                                conversation

Inclusion                       Users felt fully included       Post-session qualitative     85% + positive
                                in the conversation             feedback

Retention                       Users keep coming back          30/60/90 retention rate      >60% at 30 days
                                after first use


Zero Lost Meaning               Users missed nothing            End-of-session "Did you      Trending toward 
                                important                       miss anything?"              0%



Requirements
Requirements are organized/prioritized by critical user journeys, and help the team understand the scope of work and what functionality we need to offer. List the must-have vs nice to have requirements to support the user journey, solve the problems, and align with the goals above. 

Tips:
Focus on functionality, NOT the specificity of design/tech implementation 
DO: “User can do X”, “User can identify who has access to their document”
DON’T: “add button to title bar” or “Use single API call”
Link to mini-PRDs for more complex functionality that has more detailed requirements.
Use directional sketches/wireframes to show what you’re thinking of, or embed/link to UX mocks
Use subheadings to bucket requirements, ideally by the user lifecycle or sub-journeys, etc.
Make sure to consider requirements for all user groups


Legend
[P0] = Live Captions, Gap Filler, Confidence Highlight (your core 3)
[P1] = Live Summary and Speaker ID
[P2] = 3-Second Replay


User Journey 1: Deaf User Starting a Live Caption Session

Context: This is the most critical journey in FullCaption. A Deaf user needs to start capturing speech immediately with zero friction — every second of delay is a word lost. We are optimizing for speed, trust, and zero setup burden.

Starting a Session:
[P0] User can launch a live caption session in one tap
[P0] User can see captions streaming word-by-word in real time with under 1 second latency
[P0] User can identify which words are uncertain through Confidence Highlighting
Uncertain words appear in a distinct color so the user knows to pay closer attention or replay
[P1] User can see a live summary line below the main captions capturing the full meaning of the conversation
[P2] User can adjust caption text size, color, and display speed before or during a session

During a Session:
[P0] User can read fully gapped-filled captions where missed words are predicted by AI using surrounding context
Gap Filler activates automatically — no action required from user
[P0] User can visually distinguish between confirmed words and AI-predicted words
[P1] User can see speaker labels identifying who is talking in a multi-person conversation
Labeled as Speaker 1, Speaker 2, or by name if identified
[P2] User can tap any word to trigger a 3-Second Replay of that moment of audio
Replay is silent to others in the room — private to the user only
Ending a Session
[P0] User can end a session in one tap
[P1] User can review a full transcript of the session immediately after it ends
[P1] User can submit feedback on caption accuracy after each session
Includes a simple "Did you miss anything important?" prompt
[P2] User can save or export the session transcript


User Journey 2: Hearing Secondary User Speaking into FullCaption

Context: The hearing speaker — doctor, professor, manager — is a secondary user whose behavior directly affects caption quality. They need to speak naturally without changing their rhythm or workflow. We are optimizing for zero friction on their end.

Before Speaking:
[P0] Hearing user can activate microphone input with one tap
[P0] Hearing user receives a clear visual confirmation that FullCaption is actively listening
[P1] Hearing user can select their role — doctor, professor, manager — to activate vertical-specific vocabulary optimization

During Speaking:
[P0] Hearing user can speak naturally without slowing down or repeating themselves
[P0] System captures speech clearly even in noisy environments using AI noise filtering
[P1] Hearing user can see a basic confirmation that their words are being captured and streamed
[P2] Hearing user can pause the microphone temporarily without ending the session


User Journey 3: Using FullCaption in a High-Stakes Vertical

Context: Healthcare, legal, education, and workplace users have different vocabularies and accuracy requirements. A medical term misheard is more dangerous than a casual word misheard. We are optimizing for domain-specific accuracy and trust.

Vertical-Specific Accuracy:
[P0] System recognizes and correctly captions domain-specific terminology — medical, legal, academic
[P0] User can flag a misheard word in real time to trigger an immediate correction
[P1] System learns from flagged corrections over time to improve accuracy for that user
[P2] Admin or institution can configure FullCaption with a custom vocabulary list for their environment

Access & Permissions:
[P0] User can create an account and set up a personal profile
[P0] User can access FullCaption from a mobile device or desktop browser
[P1] Institutional users — hospitals, schools, law firms — can deploy FullCaption across multiple users under one account
[P2] Users can invite a hearing speaker to join a shared session remotely




Appendix
Designs:
Meeting notes:
Other resources:

