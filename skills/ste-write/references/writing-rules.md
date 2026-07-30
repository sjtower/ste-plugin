# The STE writing rules

This file paraphrases the ASD-STE100 Part 1 rules in the author's own words and
adds original examples. It does not reproduce the text of the specification.

The official specification groups 53 rules into 9 sections. This file groups the
same subject matter by topic for use while writing. The official numbering is in
the registered copy of the specification. Get a free copy at
<https://asd-ste100.org>.

---

## 1. Words

### One word, one meaning, one part of speech

Each word has a single approved meaning and a single part of speech. This is the
core idea of STE. A reader who knows one meaning of a word never has to guess
which meaning applies.

| Not this | This |
| --- | --- |
| Test the pump. Then record the test. | Do a check of the pump. Then record the test. |
| Oil the bearing with oil. | Lubricate the bearing with oil. |

### Use the approved word

The Part 2 dictionary gives an approved word for each meaning. When a word is
not approved, the dictionary gives the alternative. This plugin cannot ship the
dictionary. See `word-choices.md` for common cases.

### Keep technical names and technical verbs

You may use any technical name your product needs: part names, tool names,
material names, and standard technical verbs. STE does not force you to
simplify a correct technical term.

### Do not use a word as more than one part of speech

If "oil" is a noun in your document, do not also write "oil the bearing".

---

## 2. Noun phrases

### Use 3 words or fewer in a noun cluster

Long noun clusters are ambiguous. The reader cannot tell which noun modifies
which.

| Not this | This |
| --- | --- |
| the pump failure rate table | the table of pump failure rates |
| the runtime request validation error handler | the handler for runtime request-validation errors |
| main landing gear door actuator seal | the seal of the actuator on the main landing gear door |

### Keep the articles

Do not remove "a", "an", or "the" to shorten a sentence. The article tells the
reader that a noun follows, which helps a non-native reader parse the sentence.

| Not this | This |
| --- | --- |
| Remove filter and install new one. | Remove the filter and install a new filter. |

---

## 3. Verbs

### Use only the simple tenses

Permitted forms: the infinitive, the imperative, the simple present, the simple
past, and the simple future. Use a past participle only as an adjective.

| Not this | This |
| --- | --- |
| The valve has been closed. | The valve is closed. |
| We will be replacing the seal. | We will replace the seal. |
| The pump had failed before the flight. | The pump failed before the flight. |

### Do not use -ing forms

Use an -ing word only when it is a technical noun, or when it modifies a
technical noun.

| Not this | This |
| --- | --- |
| Before installing the seal, clean the groove. | Before you install the seal, clean the groove. |
| The system is monitoring the pressure. | The system monitors the pressure. |

Permitted: "the bearing", "the housing", "a warning message", "the logging
level". These are technical nouns.

### Use the active voice

In a procedure, always use the active voice with the imperative. In descriptive
text, use the passive voice only when the agent is unknown or is not important.

| Not this | This |
| --- | --- |
| The bolt must be tightened by the technician. | Tighten the bolt. |
| The file is written by the service. | The service writes the file. |

### Do not use helping verbs to make complex forms

Avoid "have been", "will have", "would have", and similar constructions.

---

## 4. Sentences

### Procedural sentence: 20 words or fewer

### Descriptive sentence: 25 words or fewer

Count every word, including articles.

### One instruction per sentence

| Not this | This |
| --- | --- |
| Remove the panel and install the new gasket. | Remove the panel. Install the new gasket. |

If two actions must occur at the same time, say so in one sentence and make the
simultaneity explicit.

### Keep the sentence parts

Do not remove the subject, the verb, or the article. A shorter sentence that
drops words is harder to read, not easier.

### Put the parts of the sentence in the usual order

Subject, verb, object. Do not move a long qualifying clause to the front.

| Not this | This |
| --- | --- |
| If the pressure is more than 30 bar and the light is on, stop the pump. | Stop the pump if the pressure is more than 30 bar and the light is on. |

---

## 5. Procedures

### Use the imperative

Start each step with the command verb.

### Use one step per action

Number the steps. Do not put two actions in one numbered step.

### Put the condition before the action

| Not this | This |
| --- | --- |
| Close the valve when the tank is empty. | When the tank is empty, close the valve. |

This order matters in a procedure: the reader must know the condition before
they do the action.

### Give the reason only when the reader needs it

Do not add background to a step. Put background in the descriptive text before
the procedure.

---

## 6. Descriptive writing

### Paragraph: 6 sentences or fewer

### One topic per paragraph

Start the paragraph with the topic sentence.

### Use a list when you have more than three related items

A list is easier to scan than a long sentence with commas.

### You may use a longer sentence to show a relation

A descriptive sentence may reach 25 words when it must show cause, condition, or
comparison. Do not go past 25.

---

## 7. Safety instructions

### Put the warning or the caution BEFORE the step

The reader must see the hazard before they do the action. A warning after the
step is a defect.

### Start with a clear command

Write the command first, then the reason.

| Not this | This |
| --- | --- |
| WARNING: Hydraulic fluid is dangerous and can cause injury to your skin. | WARNING: DO NOT TOUCH THE HYDRAULIC FLUID. The fluid can injure your skin. |

### Distinguish the three levels

- **WARNING** — a hazard that can injure or kill a person.
- **CAUTION** — a hazard that can damage equipment.
- **NOTE** — information that helps, with no hazard.

---

## 8. Punctuation

### Use simple punctuation

Use the full stop, the comma, the question mark, the colon, and the hyphen.

### Avoid the semicolon

A semicolon usually joins two sentences. Write two sentences.

### Do not use contractions

<!-- ste-check:off -->
Write "do not", "cannot", "it is". Do not write "don't", "can't", "it's".
<!-- ste-check:on -->

### Use the hyphen to make the modifier clear

<!-- ste-check:off -->
Write "a runtime request-validation error", not "a runtime request validation
error".
<!-- ste-check:on -->

### Avoid the slash

"and/or" is ambiguous. Say which one you mean.

---

## 9. Writing practices

### Be consistent

Use the same word for the same thing every time. Do not use a synonym for
variety. Variety helps a native reader and hurts everyone else.

### Do not use jargon, idiom, or metaphor

| Not this | This |
| --- | --- |
| Kick off the build. | Start the build. |
| The service is down. | The service does not operate. |

### Do not omit words to save space

### Write the number as a numeral

Write "5 bolts", not "five bolts".

### Keep the same structure in parallel items

Every item in a list starts with the same part of speech.
