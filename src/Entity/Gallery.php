<?php

namespace AmzsCMS\GalleryBundle\Entity;

use AmzsCMS\CoreBundle\Traits\Doctrine\Timestampable;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\Common\Collections\Criteria;
use Doctrine\ORM\Mapping as ORM;
use Gedmo\Mapping\Annotation as Gedmo;

/**
 * @ORM\Entity(repositoryClass="AmzsCMS\GalleryBundle\Repository\GalleryRepository")
 * @ORM\Table(name="amzs_gallery")
 * @ORM\HasLifecycleCallbacks
 * @Gedmo\Tree(type="nested")
 */
class Gallery
{
    use Timestampable;
    /**
     * @ORM\Column(type="integer")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    private  $id;


    /**
     * @ORM\Column(type="string", nullable=true)
     */
    private $name;

    /**
     * Folder | Gallery
     *
     * @ORM\Column(type="string", nullable=true)
     */
    private $type = 'folder';

    /**
     * @ORM\Column(type="integer", nullable=true)
     */
    private $sort = null;

    /**
     * TREE CONFIG
     */

    /**
     * @Gedmo\TreeLeft
     * @ORM\Column(type="integer")
     */
    protected $lft;

    /**
     * @Gedmo\TreeRight
     * @ORM\Column(type="integer")
     */
    protected $rgt;

    /**
     * @Gedmo\TreeLevel
     * @ORM\Column(type="integer")
     */
    protected $lvl;

    /**
     * @Gedmo\TreeRoot
     * @ORM\Column(type="integer", nullable=true)
     */
    protected $root;

    /**
     * @Gedmo\TreeParent
     * @ORM\ManyToOne(
     *     targetEntity="AmzsCMS\GalleryBundle\Entity\Gallery",
     *     inversedBy="children"
     * )
     * @ORM\JoinColumn(
     *     name="parent_id",
     *     referencedColumnName="id",
     *     nullable=true,
     *     onDelete="CASCADE"
     * )
     */
    protected $parent;

    /**
     * @ORM\OneToMany(
     *     targetEntity="AmzsCMS\GalleryBundle\Entity\Gallery",
     *     mappedBy="parent",
     *     cascade={"remove"}
     * )
     * @ORM\OrderBy({"lft" = "ASC"})
     */
    protected $children;

//    /**
//     *
//     * @ORM\OneToMany(
//     *     targetEntity="AmzsCMS\PictureBundle\Entity\Picture",
//     *     mappedBy="gallery"
//     * )
//     */
//    private $pictures;
//
//    /**
//     * Gallery render ngoài frontend
//     *
//     * @ORM\OneToMany(
//     *     targetEntity="AmzsCMS\PictureBundle\Entity\GalleryPictures",
//     *     mappedBy="gallery"
//     * )
//     */
//    private $galleryPictures;

    public function __construct()
    {
        $this->pictures = new ArrayCollection();
        $this->galleryPictures = new ArrayCollection();
        $this->children = new ArrayCollection();
    }

    public function __toString()
    {
        return $this->name ?? '';
    }

    /**
     * @return mixed
     */
    public function getId()
    {
        return $this->id;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(?string $name): self
    {
        $this->name = $name;

        return $this;
    }

    public function getType(): ?string
    {
        return $this->type;
    }

    public function setType(?string $type): self
    {
        $this->type = $type;

        return $this;
    }

    public function getSort()
    {
        return $this->sort;
    }

    public function setSort($sort): void
    {
        $this->sort = $sort;
    }


    public function getParent(): ?self
    {
        return $this->parent;
    }

    public function setParent(?self $parent): self
    {
        $this->parent = $parent;

        return $this;
    }

    /**
     * @return Collection<int, self>
     */
    public function getChildren(): Collection
    {
        $criteria = Criteria::create()
            ->orderBy(['lft' => 'ASC']);

        return $this->children->matching($criteria);
    }

    public function addChild(self $child): self
    {
        if (!$this->children->contains($child)) {
            $this->children->add($child);
            $child->setParent($this);
        }

        return $this;
    }

    public function removeChild(self $child): self
    {
        if ($this->children->removeElement($child)) {
            if ($child->getParent() === $this) {
                $child->setParent(null);
            }
        }

        return $this;
    }



    public function getLft()
    {
        return $this->lft;
    }

    public function setLft($lft): void
    {
        $this->lft = $lft;
    }

    public function getRgt()
    {
        return $this->rgt;
    }

    public function setRgt($rgt): void
    {
        $this->rgt = $rgt;
    }

    public function getLvl()
    {
        return $this->lvl;
    }

    public function setLvl($lvl): void
    {
        $this->lvl = $lvl;
    }

    public function getRoot()
    {
        return $this->root;
    }

    public function setRoot($root): void
    {
        $this->root = $root;
    }


//    /**
//     * @return Collection<int, Picture>
//     */
//    public function getPictures(): Collection
//    {
//        return $this->pictures;
//    }
//
//    public function addPicture(Picture $picture): self
//    {
//        if (!$this->pictures->contains($picture)) {
//            $this->pictures->add($picture);
//            $picture->setGallery($this);
//        }
//
//        return $this;
//    }

//    public function removePicture(Picture $picture): self
//    {
//        if ($this->pictures->removeElement($picture)) {
//            if ($picture->getGallery() === $this) {
//                $picture->setGallery(null);
//            }
//        }
//
//        return $this;
//    }
//
//
//
//    /**
//     * @return Collection<int, GalleryPictures>
//     */
//    public function getGalleryPictures(): Collection
//    {
//        return $this->galleryPictures;
//    }
//
//    public function addGalleryPicture(GalleryPictures $galleryPicture): self
//    {
//        if (!$this->galleryPictures->contains($galleryPicture)) {
//            $this->galleryPictures->add($galleryPicture);
//            $galleryPicture->setGallery($this);
//        }
//
//        return $this;
//    }
//
//    public function removeGalleryPicture(GalleryPictures $galleryPicture): self
//    {
//        if ($this->galleryPictures->removeElement($galleryPicture)) {
//            if ($galleryPicture->getGallery() === $this) {
//                $galleryPicture->setGallery(null);
//            }
//        }
//
//        return $this;
//    }
}