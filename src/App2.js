import { loremIpsum } from 'react-lorem-ipsum';
import React,{ useState, useRef } from 'react';
import './App.css'

const TOTAL_ARTICLES = 10;

const App2 = () => {;
    // all articles
    const [articles, setArticles] = useState([]);

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

    // Its callback has the job of iterating over the observed entries (paragraphs)
    // and mark them active as they became visible

    React.useEffect(() => {
        const observer = new IntersectionObserver( // create new instance of the Intersection Observer Object
            entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting){
                        entry.target.classList.add('active')
                    }
                });
            },
            { threshold: 0.7 } // options we pass - in this case only the visibility threshold.
        )
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

function Paragraph({ text, paragraphId, observer}) {
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


    // Rendering the paragraph of an article
    return (
        <div class='article-display'>
            <p ref={setRef} data-id={paragraphId}>{text}</p>
        </div>
    );
}

export default App2;


