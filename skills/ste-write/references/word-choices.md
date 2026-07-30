# Word choices

## What this file is, and what it is not

This file is **not** the ASD-STE100 Part 2 dictionary, and it is not derived
from it. The Part 2 dictionary is copyright ASD, Brussels, and cannot be
redistributed.

This file is a short list of common wordy constructions and their plainer
equivalents. Public writing guides contain lists of this kind. The file follows
the same principle as STE: use the plainest word, and use it the same way every
time. But the official specification, not this file, gives the approved word for
each case.

**To check dictionary compliance you need the specification or a licensed
checker.** Register for a free copy of the specification at
<https://asd-ste100.org>.

---

## Wordy phrases

| Wordy | Plainer |
| --- | --- |
| prior to | before |
| subsequent to | after |
| in order to | to |
| for the purpose of | to |
| in the event that | if |
| due to the fact that | because |
| owing to the fact that | because |
| with the exception of | except |
| in the vicinity of | near |
| at this point in time | now |
| at the present time | now |
| a large number of | many |
| in excess of | more than |
| is able to | can |
| has the ability to | can |
| it is necessary to | you must |
| it is possible to | you can |
| in conjunction with | with |
| take into consideration | consider |
| on a regular basis | regularly |
| as a means of | to |

## Wordy single words

| Wordy | Plainer |
| --- | --- |
| utilize, utilise | use |
| leverage | use |
| commence | start |
| initiate | start |
| terminate | stop |
| endeavor, endeavour | try |
| attempt | try |
| ascertain | find out |
| facilitate | help |
| assist | help |
| accomplish | do |
| possess | have |
| obtain | get |
| purchase | buy |
| indicate | show |
| demonstrate | show |
| require | need |
| sufficient | enough |
| numerous | many |
| additional | more |
| approximately | about |
| currently | now |
| previously | before |
| subsequently | then |
| therefore | so |
| however | but |
| furthermore, moreover | also |
| nevertheless | but |
| regarding, concerning | about |
| aforementioned | this |
| modification | change |
| functionality | function |

## Software-domain notes

STE comes from aerospace. These are the cases that come up most often in
software documentation.

| Avoid | Use | Reason |
| --- | --- | --- |
| Simply run the command. | Run the command. | "Simply" tells the reader the task is easy. If it is not easy for them, the word insults them. |
| Just add the flag. | Add the flag. | Same. |
| You may want to check the log. | Check the log. | Say what to do. |
| Kick off the pipeline. | Start the pipeline. | Idiom. |
| The service is down. | The service does not operate. | Idiom. |
| Spin up an instance. | Create an instance. | Idiom. |
| Make sure to set the variable. | Set the variable. | The instruction is the point. |
| Note that the port is 3000. | The port is 3000. | "Note that" adds nothing. |
| Please enter your name. | Enter your name. | Politeness adds words. |
| It should work now. | The service now operates. | Vague. |

## Words to keep

Do not simplify a correct technical term. These are technical names and stay as
they are:

`webhook`, `idempotent`, `mutex`, `migration`, `rollback`, `checksum`,
`transaction`, `authentication`, `serialize`, `bearing`, `actuator`, `torque`.

The rule is: if the term names a specific technical thing, keep it. If the term
is a long way of saying an everyday thing, replace it.
