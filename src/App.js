import { loremIpsum } from 'react-lorem-ipsum';
import React,{ useState, useRef } from 'react';
import './App.css'

const TOTAL_ARTICLES = 10;

const App = () => {;

    //usual per second...
    const [tick, setTick] = useState(null);

    // all articles
    const [articles, setArticles] = useState([]);

    //Tracking impressions time ( how long is the element on screen
    const [timers, setTimers] = useState({});

    // Will hold a ref to a "bottom" element we will observe
    const [bottom, setBottom] = useState(null);

    // Will work the IntersectionOberver events that are global to the infinite scroll
    const bottomObserver = useRef(null);

    // Will work the IntersectionOberver events for the purpose of single article
    const paragraphObserver = useRef(null);

    //Create random content
    function createArticle() {
        return {
            id: Math.random(), // not an optimal way but works for the purpose of the demo.
            title: loremIpsum({p:1, startWithLoremIpsum: true, avgWordsPerSentence: 2, avgSentencesPerParagraph: 2, random: true}),
            paragraphs: loremIpsum({p:5, startWithLoremIpsum: false, random: true
            })
        };
    }

    // Not very significan function - needed only to reload page at the end...
    function refreshPage() {
        window.location.reload(false);
    }




    // Using the tick to force a re-render the timer.
    React.useEffect(() => {
        const interval = setInterval(() => {
            setTick(new Date());
        }, 100); // the timeout controlls the flow of the timer ( so refreshes it every 0.1s in this case)
        return () => {
            clearInterval(interval);
        }; // return is a clean-up for the effect.
    }, []);


    // Its callback has the job of iterating over the observed entries (paragraphs),
    // and determining if each one should start or stop the timer.

    React.useEffect(() => {
        const observer = new IntersectionObserver( // create new instance of the Intersection Observer Object
            entries => {
                entries.forEach(entry => {
                    setTimers(timers => {   //setTimer properties
                        const id = entry.target.dataset.id; //id refers to Math.random() generated at first
                        const timer = timers[id] || { total: 0, start: null};
                        if (entry.isIntersecting) {  //trigger appropriate event if given article is visible on screen
                            timer.start = new Date();  // Start the timer
                        } else if (timer.start) {     // Stop the timer and add to the total time
                            timer.total += new Date().getTime() - timer.start.getTime(); //calculate time elapsed
                            timer.start = null; // zero the timer start as we stop intersecting the viewport
                        }
                        return { ...timers, [id]: timer };
                    });
                });
            },
            { threshold: 0.7 } // options we pass - in this case only the visibility threshold.
        );
        paragraphObserver.current = observer;
    }, []);

    // Detect when to load additional articles
    React.useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {

                //usual way of working with infinite scrolling -
                // the first entry in the array is in fact the last rendered in the group
                const entry = entries[0];
                setArticles(articles => {
                    if (entry.isIntersecting) {
                        return [...articles, createArticle()];
                    } else {
                        return articles;
                    }
                });
            },
            { threshold: 0.75, rootMargin: "50px" }
        );
        bottomObserver.current = observer; // moving the observer to new bottom.
    }, []);


    // Lastly, we can detect when the bottom ref changes, telling our observer to observe or unobserve the element:

    React.useEffect(() => {
        const observer = bottomObserver.current;
        if (bottom) {
            observer.observe(bottom);
        }

        //clean up
        return () => {
            if (bottom) {
                observer.unobserve(bottom);
            }
        };
    }, [bottom]);


    // Rendering the site content
    if (articles.length <= TOTAL_ARTICLES) return (
        <main>
            <div className="no-of-articles">
                <p>{`${articles.length} / ${TOTAL_ARTICLES}`}</p>
            </div>
            <ul>
                {
                    articles.map(article => (
                    <li key={article.id}>
                        <h2>{article.title}</h2>

                        {article.paragraphs.map((paragraph, i) => {
                            const key = `${article.id}|${i}`;
                            return (
                                <Paragraph
                                    key={key}
                                    text={paragraph}
                                    paragraphId={key}
                                    observer={paragraphObserver.current}
                                    timer={
                                        timers[key] || {
                                            total: 0,
                                            start: null
                                        }
                                    }
                                />
                            );
                        })}
                    </li>
                ))}
            </ul>
            <div ref={setBottom}>loading...</div>
        </main>
    )
    else return (<main>
        <div id="bottom">
            <button className="bottom-button" onClick={refreshPage}>Start over!</button>
        </div></main>)
}

function Paragraph({ text, paragraphId, observer, timer }) {
    // Track the ref to the paragraph being rendered
    const [ref, setRef] = React.useState(null);

    // Observe and unobserve this paragraph
    React.useEffect(() => {
        if (ref) {
            observer.observe(ref);
        }
        return () => {
            if (ref) {
                observer.unobserve(ref);
            }
        };
    }, [observer, ref]);

    // Calculate total time displayed for this paragraph
    let total = timer.total;
    // The paragraph is active when it has a start time
    const active = timer.start ? true : false;
    if (active) {
        // If it is still active, add the current time to the previous total
        total += new Date().getTime() - timer.start.getTime();
    }
    // Converting milliseconds to seconds
    const seconds = (total / 1000).toFixed(1);

    // Rendering the paragraph
    return (
        <div class='article-display'>
            <p className={`timer ${(seconds>5) ? "green" : "red"}`}>{seconds}s</p>
        <p ref={setRef} data-id={paragraphId} className={active ? "active" : "inactive"}>{text}</p>
        </div>
    );
}

export default App;


